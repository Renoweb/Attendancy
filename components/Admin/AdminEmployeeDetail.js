'use client'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import 'react-calendar/dist/Calendar.css'
// import { Tooltip } from 'react-tooltip'
// import 'react-tooltip/dist/react-tooltip.css'
import { supabase } from '@/lib/supabaseClient'

export default function AdminEmployeeDetail({ employee, attendance }) {
    const [selectedDate, setSelectedDate] = useState(null)
    const [sessions, setSessions] = useState([])
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [selectedSummary, setSelectedSummary] = useState(null)


    // Stats
    const stats = useMemo(() => {
        const totalDays = attendance.length
        const present = attendance.filter(a => a.status === 'present').length
        const absent = totalDays - present
        return { totalDays, present, absent }
    }, [attendance])

    // Calendar UI
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const d = dayjs(date).format('YYYY-MM-DD')
            const record = attendance.find(a => dayjs(a.date).format('YYYY-MM-DD') === d)
            if (record?.status === 'present') return 'attended-day'
            if (record?.status === 'absent') return 'absent-day'
        }
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
            <p className="text-gray-700 mb-2"><strong>Email:</strong> {employee.email}</p>
            <p className="text-gray-700 mb-6"><strong>Role:</strong> {employee.role || '—'}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LEFT */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">Attendance Calendar</h3>

                    <Calendar
                        locale="en-US"
                        tileClassName={tileClassName}
                        tileContent={tileContent}
                        onClickDay={handleDateClick}
                        className="bg-white/60 rounded-xl shadow-md"
                    />

                    {/* <Tooltip
                        id="attendance-tooltip"
                        place="top"
                        style={{
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.875rem'
                        }}
                    /> */}
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
                                                    {(s.duration_minutes / 60).toFixed(2)} hrs
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/40 flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">Total</span>
                                        <span className="font-bold text-blue-800">
                                            {(totalMinutes / 60).toFixed(2)} hrs
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
      `}</style>
        </div>
    )
}
