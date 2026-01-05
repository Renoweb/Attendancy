'use client'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import GlassCard from './GlassCard'
import { supabase } from '@/lib/supabaseClient'
import ConfirmModal from './shared/ConfirmModal'

const STATES = {
  DAY_START: 'DAY_START',
  WORKING: 'WORKING',
  BREAK: 'BREAK',
  LOGGED_OFF: 'LOGGED_OFF'
}

export default function AttendanceSection() {
  const today = dayjs().format('YYYY-MM-DD')

  const [summary, setSummary] = useState('')
  const [state, setState] = useState(STATES.DAY_START)
  const [openSession, setOpenSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isHoliday, setIsHoliday] = useState(false)
  const [showLogoffModal, setShowLogoffModal] = useState(false)


  /* ---------------- LOAD STATE FROM DB ---------------- */
  const loadState = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Holiday check
    const { data: holiday } = await supabase
      .from('holidays')
      .select('date')
      .eq('date', today)
      .maybeSingle()

    //gazetted holiday block work, other holidays, attendance still possible

    // if (holiday?.type === 'GAZETTED') {
    //   setIsHoliday(true)
    //   return
    // }


    // Attendance check
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (attendance) {
      setState(STATES.LOGGED_OFF)
      return
    }

    // Open session check
    const { data: session } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .is('end_time', null)
      .maybeSingle()

    if (session) {
      setOpenSession(session)
      setState(STATES.WORKING)
      return
    }

    // Any session today?
    const { data: sessions } = await supabase
      .from('work_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)

    if (sessions?.length) {
      setState(STATES.BREAK)
    } else {
      setState(STATES.DAY_START)
    }
  }

  useEffect(() => {
    loadState()
  }, [today])

  /* ---------------- HELPERS ---------------- */
  const calcMinutes = (start, end) =>
    Math.max(0, Math.floor((new Date(end) - new Date(start)) / 60000))

  /* ---------------- ACTIONS ---------------- */

  // 1️⃣ Login / Start Work
  const startWork = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('work_sessions')
      .insert({
        user_id: user.id,
        date: today,
        start_time: new Date().toISOString()
      })
      .select()
      .single()

    setOpenSession(data)
    setState(STATES.WORKING)
    setLoading(false)
  }

  // 2️⃣ Take Break
  const takeBreak = async () => {
    if (!openSession) return
    setLoading(true)

    const end = new Date().toISOString()

    await supabase
      .from('work_sessions')
      .update({
        end_time: end,
        duration_minutes: calcMinutes(openSession.start_time, end)
      })
      .eq('id', openSession.id)

    setOpenSession(null)
    setState(STATES.BREAK)
    setLoading(false)
  }

  // 3️⃣ Resume Work
  const resumeWork = async () => {
    await startWork()
  }

  // 4️⃣ Log Off (End Day)
  const logOff = async () => {
    if (!summary.trim()) {
      alert('Please add a work summary before logging off.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (openSession) await takeBreak()

    const { data: sessions } = await supabase
      .from('work_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today)

    const totalMinutes = sessions.reduce(
      (s, x) => s + (x.duration_minutes || 0),
      0
    )

    await supabase.from('attendance').insert({
      user_id: user.id,
      date: today,
      status: 'present',
      work_summary: summary || null
    })

    setState(STATES.LOGGED_OFF)
    setLoading(false)

    window.dispatchEvent(new CustomEvent('attendance-marked', { detail: today }))
    alert(`Attendance marked ✅\nTotal: ${(totalMinutes / 60).toFixed(2)} hrs`)
  }

  /* ---------------- UI ---------------- */

  // if (isHoliday) {
  //   return (
  //     <GlassCard>
  //       <h2 className="text-xl font-semibold text-blue-700">Today</h2>
  //       <p className="text-red-500">Holiday 🎉</p>
  //     </GlassCard>
  //   )
  // }

  return (
    <>
      <GlassCard className="space-y-4">
        <h2 className="text-xl font-semibold text-blue-700">Work Day</h2>

        <textarea
          className="w-full p-3 rounded-lg bg-white/30 border border-white/50"
          placeholder="What did you work on today?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={state === STATES.LOGGED_OFF}
        />

        <button
          disabled={loading || state !== STATES.DAY_START}
          onClick={startWork}
          className="w-full py-2 bg-blue-600 disabled:bg-gray-400 text-white rounded-lg"
        >
          Login / Start Work
        </button>

        <button
          disabled={loading || state !== STATES.WORKING}
          onClick={takeBreak}
          className="w-full py-2 bg-yellow-500 disabled:bg-gray-400 text-white rounded-lg"
        >
          Take Break
        </button>

        <button
          disabled={loading || state !== STATES.BREAK}
          onClick={resumeWork}
          className="w-full py-2 bg-green-600 disabled:bg-gray-400 text-white rounded-lg"
        >
          Resume Work
        </button>

        <button
          disabled={loading || state === STATES.LOGGED_OFF || state === STATES.DAY_START}
          onClick={() => setShowLogoffModal(true)}
          className="w-full py-2 bg-red-600 disabled:bg-gray-400 text-white rounded-lg"
        >
          Log Off (End Day)
        </button>
        <p className='text-gray-700 text-sm text-center'>Please make sure to add work summary before logging off</p>
      </GlassCard>
      <ConfirmModal
        open={showLogoffModal}
        title="End work for today?"
        description="This will log you off and mark today's attendance. You won't be able to edit it later."
        confirmText="Yes, Log Off"
        cancelText="Cancel"
        loading={loading}
        onClose={() => setShowLogoffModal(false)}
        onConfirm={async () => {
          if (loading) return
          setShowLogoffModal(false)
          await logOff() // 🔥 same existing logic
        }}
      />

    </>
  )
}
