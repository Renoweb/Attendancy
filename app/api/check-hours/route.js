import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import nodemailer from 'nodemailer'

dayjs.extend(isoWeek)

export async function POST(request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the start of the current week (Monday)
    const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD')
    const weekEnd = dayjs().endOf('isoWeek').format('YYYY-MM-DD')

    // 1. Fetch work sessions for this week
    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('duration_minutes')
      .eq('user_id', user_id)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const THRESHOLD_MINUTES = 35 * 60 // 35 hours

    if (totalMinutes >= THRESHOLD_MINUTES) {
      // 2. Check if a notification already exists for this week
      const { data: existingNotification } = await supabase
        .from('admin_notifications')
        .select('id')
        .eq('user_id', user_id)
        .eq('week_start_date', weekStart)
        .maybeSingle()

      if (!existingNotification) {
        // Fetch employee details for the email/message
        const { data: employee } = await supabase
          .from('employees')
          .select('name, email')
          .eq('id', user_id)
          .single()

        const empName = employee?.name || 'An employee'
        const hours = (totalMinutes / 60).toFixed(2)
        const message = `${empName} has exceeded 35 hours this week (${hours} hours so far).`

        // 3. Insert notification
        const { error: insertError } = await supabase
          .from('admin_notifications')
          .insert({
            user_id: user_id,
            week_start_date: weekStart,
            message: message
          })

        if (insertError) {
          console.error('Failed to insert notification:', insertError)
          return NextResponse.json({ error: 'Failed to insert notification' }, { status: 500 })
        }

        // 4. Fetch all admin emails from the database
        const { data: admins } = await supabase
          .from('employees')
          .select('email')
          .eq('is_admin', true)

        const adminEmails = admins?.map(a => a.email).filter(Boolean) || []

        // 5. Send Email via Nodemailer to all admins
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS && adminEmails.length > 0) {
          try {
            const transporter = nodemailer.createTransport({
              host: 'smtp.hostinger.com',
              port: 465,
              secure: true, // use SSL
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            })

            await transporter.sendMail({
              from: `"Attendancy Alert" <${process.env.EMAIL_USER}>`,
              to: adminEmails.join(', '), // Send to all admins (comma separated)
              subject: `Overtime Alert: ${empName}`,
              text: message,
              html: `<h3>Overtime Alert</h3><p>${message}</p>`,
            })
          } catch (emailError) {
            console.error('Failed to send email:', emailError)
            // We don't fail the API route if the email fails, we still want the in-app notification to persist
          }
        }
      }
    }

    return NextResponse.json({ success: true, totalMinutes })
  } catch (err) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
