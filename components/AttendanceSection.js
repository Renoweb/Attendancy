'use client'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import GlassCard from './GlassCard'
import { supabase } from '@/lib/supabaseClient'
import ConfirmModal from './shared/ConfirmModal'
import { formatMinutes } from '@/lib/SharedFucntions'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false })

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
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)


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

    // Draft check
    const { data: draft } = await supabase
      .from('work_summary_drafts')
      .select('draft_content, updated_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (draft) {
      setSummary(draft.draft_content || '')
      setDraftSavedAt(new Date(draft.updated_at))
    }

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

  const saveDraft = async () => {
    if (!summary.trim()) return
    setSavingDraft(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Upsert the draft
    const { error } = await supabase
      .from('work_summary_drafts')
      .upsert({
        user_id: user.id,
        date: today,
        draft_content: summary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' })
      
    setSavingDraft(false)
    if (!error) {
      setDraftSavedAt(new Date())
    } else {
      console.error('Failed to save draft:', error)
    }
  }

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

    const { data: { session } } = await supabase.auth.getSession()

    fetch('/api/check-hours', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ user_id: openSession.user_id })
    }).catch(console.error)

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

    const { data: { session } } = await supabase.auth.getSession()

    fetch('/api/check-hours', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ user_id: user.id })
    }).catch(console.error)

    setState(STATES.LOGGED_OFF)
    setLoading(false)

    window.dispatchEvent(new CustomEvent('attendance-marked', { detail: today }))
    alert(`Attendance marked ✅\nTotal: ${formatMinutes(totalMinutes)} hrs`)
  }


  return (
    <>
      <GlassCard className="space-y-4">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">Work Day</h2>

        <div className="flex flex-col gap-2">
          <RichTextEditor
            value={summary}
            onChange={setSummary}
            placeholder="What did you work on today?"
            readOnly={state === STATES.LOGGED_OFF}
          />
          {state !== STATES.LOGGED_OFF && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {draftSavedAt ? `Last saved at ${dayjs(draftSavedAt).format('h:mm A')}` : 'Not saved yet'}
              </span>
              <button
                onClick={saveDraft}
                disabled={savingDraft || !summary.trim()}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 transition-colors bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md"
              >
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          )}
        </div>

        <button
          disabled={loading || state !== STATES.DAY_START}
          onClick={startWork}
          className="w-full py-2 bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-[#1a1a1a] dark:disabled:text-gray-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Login / Start Work
        </button>

        <button
          disabled={loading || state !== STATES.WORKING}
          onClick={takeBreak}
          className="w-full py-2 bg-yellow-500 disabled:bg-gray-400 dark:disabled:bg-[#1a1a1a] dark:disabled:text-gray-600 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          Take Break
        </button>

        <button
          disabled={loading || state !== STATES.BREAK}
          onClick={resumeWork}
          className="w-full py-2 bg-green-600 disabled:bg-gray-400 dark:disabled:bg-[#1a1a1a] dark:disabled:text-gray-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Resume Work
        </button>

        <button
          disabled={loading || state === STATES.LOGGED_OFF || state === STATES.DAY_START}
          onClick={() => setShowLogoffModal(true)}
          className="w-full py-2 bg-red-600 disabled:bg-gray-400 dark:disabled:bg-[#1a1a1a] dark:disabled:text-gray-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Log Off (End Day)
        </button>
        <p className='text-gray-700 dark:text-gray-500 text-sm text-center'>Please make sure to add work summary before logging off</p>
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
