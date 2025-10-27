'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import 'react-calendar/dist/Calendar.css'
import { supabase } from '@/lib/supabaseClient'

const Calendar = dynamic(() => import('react-calendar'), { ssr: false })

export default function CalendarSection() {
  const [attendanceDates, setAttendanceDates] = useState([])
  const [holidays, setHolidays] = useState([])
  const [currentMonth, setCurrentMonth] = useState(dayjs()) // 🗓️ track current month

  // ✅ Fetch data for a specific month
  const fetchMonthData = async (month) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startOfMonth = month.startOf('month').format('YYYY-MM-DD')
    const endOfMonth = month.endOf('month').format('YYYY-MM-DD')

    // Attendance for current month
    const { data: attData } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    // Holidays for current month
    const { data: holData } = await supabase
      .from('holidays')
      .select('date')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    setAttendanceDates(attData?.map(a => dayjs(a.date).format('YYYY-MM-DD')) || [])
    setHolidays(holData?.map(h => dayjs(h.date).format('YYYY-MM-DD')) || [])
  }

  // ✅ Fetch data on load
  useEffect(() => {
    fetchMonthData(currentMonth)

    // Re-render calendar instantly when attendance is marked
    const handleMarked = (e) => {
      const d = e.detail
      setAttendanceDates((prev) => [...new Set([...prev, d])])
    }
    window.addEventListener('attendance-marked', handleMarked)
    return () => window.removeEventListener('attendance-marked', handleMarked)
  }, [])

  // ✅ Refetch when month changes
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    const newMonth = dayjs(activeStartDate)
    setCurrentMonth(newMonth)
    fetchMonthData(newMonth)

    // Dispatch a custom event so Dashboard stats can update too
    window.dispatchEvent(new CustomEvent('month-changed', { detail: newMonth.format('YYYY-MM') }))
  }

  // ✅ Tile color logic
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const d = dayjs(date).format('YYYY-MM-DD')
      if (holidays.includes(d)) return 'holiday-day'
      if (attendanceDates.includes(d)) return 'attended-day'
      if (d === dayjs().format('YYYY-MM-DD')) return 'today-day'
    }
    return null
  }

  return (
    <div className="p-6 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-2xl shadow-lg">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Attendance Calendar
      </h2>

      <Calendar
        locale="en-US"
        tileClassName={tileClassName}
        onActiveStartDateChange={handleActiveStartDateChange}
        className="opacity-95"
      />

      <div className="mt-4 text-sm text-gray-700">Blue = Present | Red = Holiday</div>

      <style jsx global>{`
        .today-day {
          background: rgba(191, 219, 254, 0.8) !important;
          color: #1e3a8a !important;
          border-radius: 10px !important;
        }

        .holiday-day {
          background: #ef4444 !important;
          color: white !important;
          border-radius: 10px !important;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }

        .react-calendar {
          background: transparent !important;
          border: none !important;
          width: 100%;
          font-family: inherit;
        }

        .react-calendar__navigation button {
          color: #1e40af;
          font-weight: 600;
          background: transparent;
          border-radius: 8px;
        }

        .react-calendar__navigation button:hover {
          background: rgba(191, 219, 254, 0.4);
        }

        .react-calendar__month-view__weekdays__weekday {
          color: #2563eb;
          font-weight: 600;
        }

        .react-calendar__tile {
          background: rgba(255, 255, 255, 0.4);
          border-radius: 10px;
          transition: all 0.2s ease;
          color: #1e3a8a;
          font-weight: 500;
        }

        .react-calendar__tile:hover {
          background: rgba(219, 234, 254, 0.8);
        }

        .attended-day {
          background: #3b82f6 !important;
          color: white !important;
          border-radius: 10px !important;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

        .react-calendar__tile--now.attended-day {
          background: #2563eb !important;
          color: white !important;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
        }
      `}</style>
    </div>
  )
}
