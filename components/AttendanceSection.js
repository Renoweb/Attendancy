'use client'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import GlassCard from './GlassCard'
// import { supabase } from '@/lib/supabaseClient'

export default function AttendanceSection() {
  const [marked, setMarked] = useState(false)
  const [summary, setSummary] = useState('')

  useEffect(() => {
    // Later: Check if attendance for today exists (uncomment)
    /*
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return
      const today = dayjs().format('YYYY-MM-DD')
      const { data } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
      setMarked(data && data.length > 0)
    }
    load()
    */
  }, [])

  const handleMark = async () => {
    if (marked) return
    let today = dayjs().format('YYYY-MM-DD')
    const time = dayjs().format('HH:mm:ss')

    // Uncomment to save via Supabase
    /*
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      alert('Not logged in')
      return
    }
    const { error } = await supabase
      .from('attendance')
      .insert([
        {
          user_id: user.id,
          date: today,
          time: time,
          work_summary: summary || null,
        },
      ])
    if (error) {
      console.error(error)
      alert('Error saving attendance')
      return
    }
    */

    // Fake success:
    setMarked(true)
    // Optional: visually simulate calendar update
    // Trigger calendar update for today
    today = dayjs().format('YYYY-MM-DD')
    window.dispatchEvent(new CustomEvent('attendance-marked', { detail: today }))


    alert('Marked attendance for today ✅')
    console.log('Simulating attendance added to DB: ', dayjs().format('YYYY-MM-DD'))
  }

  return (
    <GlassCard className="space-y-4">
      <h2 className="text-xl font-semibold text-blue-700">Today's Attendance</h2>
      <textarea
        className="w-full p-3 rounded-lg bg-white/30 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="What did you work on today?"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        disabled={marked}
      ></textarea>
      <button
        onClick={handleMark}
        disabled={marked}
        className={`w-full py-2 rounded-lg text-white font-semibold transition ${marked
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {marked ? 'Already Marked' : 'Mark Attendance'}
      </button>
    </GlassCard>
  )
}
