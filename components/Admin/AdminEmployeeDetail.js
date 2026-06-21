'use client'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import 'react-calendar/dist/Calendar.css'
import { supabase } from '@/lib/supabaseClient'
import { fetchWeeklyMinutes, formatMinutes } from '@/lib/SharedFucntions'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('../RichTextEditor'), { ssr: false })

export default function AdminEmployeeDetail({ employee, attendance }) {
    const [selectedDate, setSelectedDate] = useState(null) // Selected date on calendar
    const [sessions, setSessions] = useState([]) // Work sessions for selected date
    const [loadingSessions, setLoadingSessions] = useState(false) // Loading state for sessions
    const [selectedSummary, setSelectedSummary] = useState(null) // Work summary for selected date
    const [holidays, setHolidays] = useState([]) // Holidays in current month

    // Weekly stats
    const [weeklyTotal, setWeeklyTotal] = useState(null)
    const [weeklyRange, setWeeklyRange] = useState(null)

    // Date range picker states
    const [rangeStart, setRangeStart] = useState(null)
    const [rangeEnd, setRangeEnd] = useState(null)
    const [rangeTotal, setRangeTotal] = useState(null)
    const [showPicker, setShowPicker] = useState(null) // 'start' | 'end' | null
    const [currentMonth, setCurrentMonth] = useState(dayjs()) // Track current month

    const fetchHolidaysForMonth = async (month) => {
        const startOfMonth = month.startOf('month').format('YYYY-MM-DD')
        const endOfMonth = month.endOf('month').format('YYYY-MM-DD')

        const { data } = await supabase
            .from('holidays')
            .select('date, type')
            .gte('date', startOfMonth)
            .lte('date', endOfMonth)

        setHolidays(
            data?.map(h => ({
                date: dayjs(h.date).format('YYYY-MM-DD'),
                type: h.type
            })) || []
        )
    }

    useEffect(() => {
        fetchHolidaysForMonth(currentMonth)
    }, [])

    const handleActiveStartDateChange = ({ activeStartDate }) => {
        const newMonth = dayjs(activeStartDate)
        setCurrentMonth(newMonth)
        fetchHolidaysForMonth(newMonth)
    }

    const holidayMap = useMemo(() => {
        const map = {}
        holidays.forEach(h => {
            if (!map[h.date]) map[h.date] = []
            map[h.date].push(h.type)
        })
        return map
    }, [holidays])



    // Stats
    const stats = useMemo(() => {
        const totalDays = attendance.length
        const present = attendance.filter(a => a.status === 'present').length
        const absent = totalDays - present
        return { totalDays, present, absent }
    }, [attendance])

    // Load weekly hours on mount
    const loadWeeklyHours = async (date) => {
        const { totalMinutes, weekStart, weekEnd } =
            await fetchWeeklyMinutes(employee.id, date)

        setWeeklyTotal(totalMinutes)
        setWeeklyRange({ weekStart, weekEnd })
    }

    // Date range select handler
    const handleRangeSelect = (date) => {
        const d = dayjs(date).format('YYYY-MM-DD')

        if (showPicker === 'start') {
            setRangeStart(d)
            if (rangeEnd && d > rangeEnd) setRangeEnd(null)
        }

        if (showPicker === 'end') {
            setRangeEnd(d)
        }

        setShowPicker(null)
    }

    // Load custom range hours
    const loadCustomRangeHours = async () => {
        if (!rangeStart || !rangeEnd) return

        const { data } = await supabase
            .from('work_sessions')
            .select('duration_minutes')
            .eq('user_id', employee.id)
            .gte('date', rangeStart)
            .lte('date', rangeEnd)

        const total = data?.reduce(
            (sum, s) => sum + (s.duration_minutes || 0),
            0
        ) || 0

        setRangeTotal(total)
    }

    // Load custom range hours when range changes
    useEffect(() => {
        loadCustomRangeHours()
    }, [rangeStart, rangeEnd])



    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null

        const d = dayjs(date).format('YYYY-MM-DD')
        const record = attendance.find(
            a => dayjs(a.date).format('YYYY-MM-DD') === d
        )
        const dayHolidays = holidayMap[d] || []

        // 🔵 Attendance always wins
        if (record?.status === 'present') {
            if (dayHolidays.includes('GAZETTED')) {
                return 'attended-holiday'
            }
            if (dayHolidays.includes('RESTRICTED')) {
                return 'attended-day restricted-ring'
            }
            return 'attended-day'
        }

        // ❌ Absent (no work done)
        if (record?.status === 'absent') return 'absent-day'

        // Holidays without attendance
        if (dayHolidays.includes('GAZETTED')) return 'holiday-gazetted-ring'
        if (dayHolidays.includes('RESTRICTED')) return 'holiday-restricted-ring'

        return null
    }


    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const d = dayjs(date).format('YYYY-MM-DD')
            const record = attendance.find(a => dayjs(a.date).format('YYYY-MM-DD') === d)
            if (record?.work_summary) {
                const rawSummary = record.work_summary.replace(/<[^>]*>?/gm, '');
                return (
                    <div
                        data-tooltip-id="attendance-tooltip"
                        data-tooltip-content={rawSummary}
                        className="w-full h-full"
                    />
                )
            }
        }
        return null
    }

    // Date click Handler
    const handleDateClick = async (date) => {
        const d = dayjs(date).format('YYYY-MM-DD')
        setSelectedDate(d)
        setLoadingSessions(true)

        await loadWeeklyHours(d)

        const { data } = await supabase
            .from('work_sessions')
            .select('*')
            .eq('user_id', employee.id)
            .eq('date', d)
            .order('start_time', { ascending: true })

        setSessions(data || [])

        // get summary from attendance
        const record = attendance.find(
            a => dayjs(a.date).format('YYYY-MM-DD') === d
        )
        setSelectedSummary(record?.work_summary || null)

        setLoadingSessions(false)
    }

    // Helpers
    const formatTime = (t) => dayjs(t).format('hh:mm A')

    const totalMinutes = sessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
    )

    return (
        <div>
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6">{employee.name}</h2>
            <p className="text-gray-700 dark:text-gray-400 mb-2">
                <strong className="block dark:text-gray-300">Email</strong>
                <span className="text-gray-800 dark:text-gray-300 break-all">
                    {employee.email}
                </span>
            </p>

            <p className="text-gray-700 dark:text-gray-400 mb-6"><strong className="dark:text-gray-300">Role:</strong> {employee.role || '—'}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LEFT */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-400 mb-3">Attendance Calendar</h3>
                    {/* Weekly total display */}
                    {weeklyTotal !== null && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Week ({dayjs(weeklyRange.weekStart).format('MMM D')} –{' '}
                                {dayjs(weeklyRange.weekEnd).format('MMM D')})
                            </p>
                            <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                                Total: {formatMinutes(weeklyTotal)}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 rounded-xl border mb-3 border-white/40 dark:border-[#222222] bg-white/30 dark:bg-[#111111] p-4">
                        <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">
                            Custom Date Range
                        </h4>

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() =>
                                    setShowPicker(prev => (prev === 'start' ? null : 'start'))
                                }
                                className="px-4 py-2 bg-white/60 dark:bg-[#1a1a1a] dark:text-gray-300 rounded-lg border dark:border-[#333333]"
                            >
                                {rangeStart ? dayjs(rangeStart).format('DD MMM YYYY') : 'Start date'}
                            </button>

                            <button
                                onClick={() =>
                                    setShowPicker(prev => (prev === 'end' ? null : 'end'))
                                }
                                className="px-4 py-2 bg-white/60 dark:bg-[#1a1a1a] dark:text-gray-300 rounded-lg border dark:border-[#333333]"
                                disabled={!rangeStart}
                            >
                                {rangeEnd ? dayjs(rangeEnd).format('DD MMM YYYY') : 'End date'}
                            </button>
                        </div>

                        {rangeTotal !== null && (
                            <p className="mt-3 text-blue-800 dark:text-blue-400 font-semibold">
                                Total: {formatMinutes(rangeTotal)}
                            </p>
                        )}

                        {showPicker && (
                            <div className="relative">
                                <div className="absolute z-20 mt-3 rounded-2xl bg-white dark:bg-[#111111] shadow-2xl border border-gray-200 dark:border-[#222222] p-3  left-[-50px]  mx-auto w-[95vw] max-w-[270px] md:max-w-[360px]">
                                    <Calendar
                                        onClickDay={handleRangeSelect}
                                        minDate={
                                            showPicker === 'end' && rangeStart
                                                ? new Date(rangeStart)
                                                : undefined
                                        }
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="bg-white/40 dark:bg-[#111111] p-4 rounded-2xl shadow-lg border border-white/40 dark:border-[#222222] backdrop-blur-xl max-w-[300px] md:max-w-[70%]">
                        <Calendar
                            locale="en-US"
                            tileClassName={tileClassName}
                            tileContent={tileContent}
                            onClickDay={handleDateClick}
                            onActiveStartDateChange={handleActiveStartDateChange}
                            className="w-full opacity-95"
                        />
                    </div>
                    <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <div>🔵 <span className="font-medium">Blue</span> — Attendance marked</div>
                        <div>🟡 <span className="font-medium">Yellow ring</span> — Restricted holiday</div>
                        <div>🔴 <span className="font-medium">Red ring</span> — Gazetted holiday</div>
                        <div>🟣 <span className="font-medium">Violet ring + gray</span> — Worked on gazetted holiday</div>
                    </div>


                </div>

                {/* RIGHT */}
                <div>
                    <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-400 mb-3">
                        Attendance Overview
                    </h3>

                    <ul className="text-gray-700 dark:text-gray-300 space-y-1 mb-6">
                        <li>Total Records: <strong className="dark:text-white">{stats.totalDays}</strong></li>
                        <li>Days Present: <strong className="text-green-600 dark:text-green-400">{stats.present}</strong></li>
                        <li>Days Missed: <strong className="text-red-500 dark:text-red-400">{stats.absent}</strong></li>
                    </ul>

                    {/* Summary */}
                    {selectedSummary && (
                        <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                                Work Summary
                            </p>

                            <div className="mt-2 text-sm max-h-56 overflow-y-auto pr-2">
                                <RichTextEditor
                                    value={selectedSummary}
                                    readOnly={true}
                                />
                            </div>
                        </div>
                    )}



                    {/* DAY DETAIL PANEL */}
                    {selectedDate && (
                        <div className="bg-white/40 dark:bg-[#111111] backdrop-blur-xl border border-white/40 dark:border-[#222222] rounded-2xl p-5 shadow-lg">
                            <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">
                                {dayjs(selectedDate).format('dddd, MMM D')}
                            </h4>

                            {loadingSessions ? (
                                <p className="text-gray-500 dark:text-gray-400">Loading sessions…</p>
                            ) : sessions.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No sessions recorded.</p>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {sessions.map((s, i) => (
                                            <div
                                                key={s.id}
                                                className="flex justify-between items-center bg-white/60 dark:bg-[#0a0a0a] rounded-xl px-4 py-3 shadow-sm dark:border dark:border-[#222222]"
                                            >
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-500">
                                                        Session {i + 1}
                                                    </p>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                                                    </p>
                                                </div>

                                                <div className="text-blue-700 dark:text-blue-400 font-semibold">
                                                    {formatMinutes(s.duration_minutes)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/40 dark:border-[#222222] flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                                        <span className="font-bold text-blue-800 dark:text-blue-400">
                                            {formatMinutes(totalMinutes)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
        .attended-day {
          background: #3b82f6 !important;
          color: white !important;
          border-radius: 10px !important;
        }
        .absent-day {
          background: #ef4444 !important;
          color: white !important;
          border-radius: 10px !important;
        }
          /* 🟡 Restricted holiday */
.react-calendar__tile.holiday-restricted-ring {
  box-shadow: 0 0 0 3px #facc15 inset !important;
  border-radius: 10px !important;
}

/* 🔴 Gazetted holiday */
.react-calendar__tile.holiday-gazetted-ring {
  box-shadow: 0 0 0 3px #ef4444 inset !important;
  border-radius: 10px !important;
}

/* 🟣 Worked on gazetted holiday */
.react-calendar__tile.attended-holiday {
  background: #e5e7eb !important; /* gray */
  color: #1f2937 !important;
  border-radius: 10px !important;
  box-shadow: 0 0 0 3px #8b5cf6 inset !important; /* violet */
}

      `}</style>
        </div>
    )
}
