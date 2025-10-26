'use client'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import 'react-calendar/dist/Calendar.css'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

export default function AdminEmployeeDetail({ employee, attendance }) {
    const stats = useMemo(() => {
        const totalDays = attendance.length
        const present = attendance.filter(a => a.status === 'present').length
        const absent = totalDays - present
        return { totalDays, present, absent }
    }, [attendance])

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


    return (
        <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-6">{employee.name}</h2>
            <p className="text-gray-700 mb-2"><strong>Email:</strong> {employee.email}</p>
            <p className="text-gray-700 mb-6"><strong>Role:</strong> {employee.role || '—'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">Attendance Overview</h3>
                    <ul className="text-gray-700 space-y-1">
                        <li>Total Records: <strong>{stats.totalDays}</strong></li>
                        <li>Days Present: <strong className="text-green-600">{stats.present}</strong></li>
                        <li>Days Missed: <strong className="text-red-500">{stats.absent}</strong></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">Attendance Calendar</h3>
                    <Calendar
                        locale="en-US"
                        tileClassName={tileClassName}
                        tileContent={tileContent}
                        className="bg-white/60 rounded-xl shadow-md"
                    />
                    <Tooltip
                        id="attendance-tooltip"
                        place="top"
                        style={{
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.875rem'
                        }}
                    />
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
