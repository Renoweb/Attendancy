import dayjs from 'dayjs'
import { supabase } from '@/lib/supabaseClient'

// Convert total minutes to "Xh YYm" format
export const formatMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h}h ${m.toString().padStart(2, '0')}m`
}

// Sunday → Saturday, week range
export const getWeekRange = (date) => {
    const d = dayjs(date)
    const weekStart = d.startOf('week')   // Sunday
    const weekEnd = d.endOf('week')       // Saturday
    return {
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: weekEnd.format('YYYY-MM-DD'),
    }
}

// Fetch total work session minutes for a user in a given week
export const fetchWeeklyMinutes = async (userId, date) => {
    const { weekStart, weekEnd } = getWeekRange(date)

    const { data, error } = await supabase
        .from('work_sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', weekEnd)

    if (error) throw error

    const totalMinutes = data.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
    )

    return {
        weekStart,
        weekEnd,
        totalMinutes,
    }
}