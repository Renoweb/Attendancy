'use client'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import GlassCard from './GlassCard'
import { supabase } from '@/lib/supabaseClient'

export default function AttendanceSection() {
  const [marked, setMarked] = useState(false)
  const [summary, setSummary] = useState('')
  const [isHoliday, setIsHoliday] = useState(false)
  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    const loadData = async () => {
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1️⃣ Check if today is holiday
      const { data: holidayData } = await supabase
        .from('holidays')
        .select('date')
        .eq('date', today)
        .maybeSingle()

      if (holidayData) {
        setIsHoliday(true)
        return
      }

      // 2️⃣ Check if attendance already marked
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)

      setMarked(attendanceData && attendanceData.length > 0)
    }

    loadData()
  }, [today])

  const handleMark = async () => {
    if (marked || isHoliday) return
    // const time = dayjs().format('HH:mm:ss')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('You must be logged in!')

    const { error } = await supabase
      .from('attendance')
      .insert([
        {
          user_id: user.id,
          date: today,
          work_summary: summary || null,
        },
      ])

    if (error) {
      console.error(error)
      alert('Error saving attendance')
      return
    }

    setMarked(true)
    window.dispatchEvent(new CustomEvent('attendance-marked', { detail: today }))
    alert('Attendance marked successfully ✅')
  }

  return (
    <GlassCard className="space-y-4">
      <h2 className="text-xl font-semibold text-blue-700">Today's Attendance</h2>

      {isHoliday && (
        <p className="text-red-500 text-sm font-medium">
          Today is a holiday 🎉 — attendance disabled.
        </p>
      )}

      <textarea
        className="w-full p-3 rounded-lg bg-white/30 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="What did you work on today?"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        disabled={marked || isHoliday}
      />

      <button
        onClick={handleMark}
        disabled={marked || isHoliday}
        className={`w-full py-2 rounded-lg text-white font-semibold transition ${marked || isHoliday
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isHoliday
          ? 'Holiday — Attendance Locked'
          : marked
            ? 'Already Marked'
            : 'Mark Attendance'}
      </button>
    </GlassCard>
  )
}
