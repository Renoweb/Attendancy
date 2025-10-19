'use client'
import { useState, useEffect, useMemo } from 'react'
import Calendar from 'react-calendar'
import dayjs from 'dayjs'
import 'react-calendar/dist/Calendar.css'
// import { supabase } from '@/lib/supabaseClient' // Uncomment later for DB connection

export default function CalendarSection() {
  // 🧩 Dummy attendance dates (replace later with fetched Supabase data)
  // 🧩 Dummy attendance and holidays
  const initialAttendance = useMemo(
    () => ['2025-10-11', '2025-10-12', '2025-10-13', '2025-10-16'],
    []
  )
  const holidays = useMemo(() => ['2025-10-19', '2025-10-22'], [])

  // ✅ Make attendance dynamic
  const [attendanceDates, setAttendanceDates] = useState(initialAttendance)

  // When "Mark Attendance" event is fired
  useEffect(() => {
    const handleMarked = (e) => {
      setAttendanceDates((prev) => [...new Set([...prev, e.detail])])
    }
    window.addEventListener('attendance-marked', handleMarked)
    return () => window.removeEventListener('attendance-marked', handleMarked)
  }, [])



  // 🎨 For each calendar tile
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const d = dayjs(date).format('YYYY-MM-DD')

      // Red for holidays
      if (holidays.includes(d)) return 'holiday-day'

      // Solid blue if marked
      if (attendanceDates.includes(d)) return 'attended-day'

      // Light blue if today (not yet marked)
      if (d === dayjs().format('YYYY-MM-DD')) return 'today-day'
    }
    return null
  }


  return (
    <div className="p-6 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-2xl shadow-lg">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Attendance Calendar
      </h2>

      {/* Read-only calendar */}
      <Calendar
        tileClassName={tileClassName}
        className="pointer-events-none opacity-95"
      />

      <div className="mt-4 text-sm text-gray-700">Blue = Present</div>

      <style jsx global>{`
      .today-day {
            background: rgba(191, 219, 254, 0.8) !important; /* light blue */
            color: #1e3a8a !important;
            border-radius: 10px !important;
          }

          .holiday-day {
            background: #ef4444 !important; /* red-500 */
            color: white !important;
            border-radius: 10px !important;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          }

        /* Glassy calendar styling */
        .react-calendar {
          background: transparent !important;
          border: none !important;
          width: 100%;
          font-family: inherit;
        }

        .react-calendar__navigation button {
          color: #1e40af; /* blue-800 */
          font-weight: 600;
          background: transparent;
          border-radius: 8px;
        }

        .react-calendar__navigation button:hover {
          background: rgba(191, 219, 254, 0.4); /* light blue hover */
        }

        .react-calendar__month-view__weekdays__weekday {
          color: #2563eb; /* blue-600 */
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
          background: #3b82f6 !important; /* blue-500 */
          color: white !important;
          border-radius: 10px !important;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

       /* Ensure attended day overrides "today" style */
            .react-calendar__tile--now.attended-day {
            background: #2563eb !important; /* solid blue */
            color: white !important;
            box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
            }

      `}</style>
    </div>
  )
}
