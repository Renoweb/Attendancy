import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Ensure the user is authenticated to access this
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in .env')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use the service role key to bypass RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey
    )

    // Past week date range
    const lastWeekStart = dayjs().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD')
    const lastWeekEnd = dayjs().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD')

    // 1. Fetch all non-archived employees
    const { data: employees, error: empError } = await adminSupabase
      .from('employees')
      .select('id, name, role')
      .eq('is_archived', false)

    if (empError) {
      console.error('Error fetching employees:', empError)
      return NextResponse.json({ error: 'Database error fetching employees' }, { status: 500 })
    }

    // 2. Fetch work sessions for the past week
    const { data: sessions, error: sessionsError } = await adminSupabase
      .from('work_sessions')
      .select('user_id, duration_minutes')
      .gte('date', lastWeekStart)
      .lte('date', lastWeekEnd)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Database error fetching sessions' }, { status: 500 })
    }

    // 3. Aggregate sessions by employee
    const aggregated = employees.map(employee => {
      const empSessions = sessions?.filter(s => s.user_id === employee.id) || []
      const totalMinutes = empSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      const totalHours = Number((totalMinutes / 60).toFixed(2))

      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        hours: totalHours,
      }
    })

    // 4. Sort and get top 3
    aggregated.sort((a, b) => b.hours - a.hours)
    
    // Filter out people with 0 hours so they don't show up on the leaderboard if nobody worked
    const topPerformers = aggregated.filter(emp => emp.hours > 0).slice(0, 3)

    return NextResponse.json({ 
        success: true, 
        dateRange: { start: lastWeekStart, end: lastWeekEnd },
        data: topPerformers 
    })

  } catch (err) {
    console.error('Leaderboard API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
