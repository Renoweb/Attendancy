'use client'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import 'react-calendar/dist/Calendar.css'
import { supabase } from '@/lib/supabaseClient'
import { fetchWeeklyMinutes, formatMinutes } from '@/lib/SharedFucntions'

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


    useEffect(() => {
        const fetchHolidays = async () => {
            const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
            const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

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

        fetchHolidays()
    }, [])

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
                return (
                    <div
                        data-tooltip-id="attendance-tooltip"
                        data-tooltip-content={record.work_summary}
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
            <h2 className="text-3xl font-bold text-blue-700 mb-6">{employee.name}</h2>
            <p className="text-gray-700 mb-2">
                <strong className="block">Email</strong>
                <span className="text-gray-800 break-all">
                    {employee.email}
                </span>
            </p>

            <p className="text-gray-700 mb-6"><strong>Role:</strong> {employee.role || '—'}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LEFT */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">Attendance Calendar</h3>
                    {/* Weekly total display */}
                    {weeklyTotal !== null && (
                        <div className="mt-4  rounded-xl border border-white/40">
                            <p className="text-sm text-gray-600">
                                Week ({dayjs(weeklyRange.weekStart).format('MMM D')} –{' '}
                                {dayjs(weeklyRange.weekEnd).format('MMM D')})
                            </p>
                            <p className="text-lg font-semibold text-blue-700">
                                Total: {formatMinutes(weeklyTotal)}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 rounded-xl border mb-3 border-white/40 bg-white/30">
                        <h4 className="text-lg font-semibold text-blue-700 mb-3">
                            Custom Date Range
                        </h4>

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() =>
                                    setShowPicker(prev => (prev === 'start' ? null : 'start'))
                                }
                                className="px-4 py-2 bg-white/60 rounded-lg border"
                            >
                                {rangeStart ? dayjs(rangeStart).format('DD MMM YYYY') : 'Start date'}
                            </button>

                            <button
                                onClick={() =>
                                    setShowPicker(prev => (prev === 'end' ? null : 'end'))
                                }
                                className="px-4 py-2 bg-white/60 rounded-lg border"
                                disabled={!rangeStart}
                            >
                                {rangeEnd ? dayjs(rangeEnd).format('DD MMM YYYY') : 'End date'}
                            </button>
                        </div>

                        {rangeTotal !== null && (
                            <p className="mt-3 text-blue-800 font-semibold">
                                Total: {formatMinutes(rangeTotal)}
                            </p>
                        )}

                        {showPicker && (
                            <div className="relative">
                                <div className="absolute z-20 mt-3 rounded-2xl bg-white shadow-2xl border border-gray-200 p-3  left-[-50px]  mx-auto w-[95vw] max-w-[270px] md:max-w-[360px]">
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

                    <Calendar
                        locale="en-US"
                        tileClassName={tileClassName}
                        tileContent={tileContent}
                        onClickDay={handleDateClick}
                        className="bg-white/60 rounded-xl shadow-md"
                    />
                    <div className="mt-4 text-sm text-gray-700 space-y-1">
                        <div>🔵 <span className="font-medium">Blue</span> — Attendance marked</div>
                        <div>🟡 <span className="font-medium">Yellow ring</span> — Restricted holiday</div>
                        <div>🔴 <span className="font-medium">Red ring</span> — Gazetted holiday</div>
                        <div>🟣 <span className="font-medium">Violet ring + gray</span> — Worked on gazetted holiday</div>
                    </div>


                </div>

                {/* RIGHT */}
                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">
                        Attendance Overview
                    </h3>

                    <ul className="text-gray-700 space-y-1 mb-6">
                        <li>Total Records: <strong>{stats.totalDays}</strong></li>
                        <li>Days Present: <strong className="text-green-600">{stats.present}</strong></li>
                        <li>Days Missed: <strong className="text-red-500">{stats.absent}</strong></li>
                    </ul>

                    {/* Summary */}
                    {selectedSummary && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-700 mb-2">
                                Work Summary
                            </p>

                            <div
                                className="text-gray-700 text-sm leading-relaxed max-h-56 overflow-y-auto pr-2"
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {selectedSummary}
                            </div>
                        </div>
                    )}



                    {/* DAY DETAIL PANEL */}
                    {selectedDate && (
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-lg">
                            <h4 className="text-lg font-semibold text-blue-700 mb-3">
                                {dayjs(selectedDate).format('dddd, MMM D')}
                            </h4>

                            {loadingSessions ? (
                                <p className="text-gray-500">Loading sessions…</p>
                            ) : sessions.length === 0 ? (
                                <p className="text-gray-500">No sessions recorded.</p>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {sessions.map((s, i) => (
                                            <div
                                                key={s.id}
                                                className="flex justify-between items-center bg-white/60 rounded-xl px-4 py-3 shadow-sm"
                                            >
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Session {i + 1}
                                                    </p>
                                                    <p className="font-medium text-gray-800">
                                                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                                                    </p>
                                                </div>

                                                <div className="text-blue-700 font-semibold">
                                                    {formatMinutes(s.duration_minutes)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/40 flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">Total</span>
                                        <span className="font-bold text-blue-800">
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
