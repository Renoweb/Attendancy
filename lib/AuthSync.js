'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthSync() {
    const hasSynced = useRef(false)
    useEffect(() => {
        const handleSession = async (session) => {
            if (!session?.user || hasSynced.current) return
            hasSynced.current = true // ✅ Prevents double insert

            const user = session.user
            // console.log('AuthSync: user session ready →', user.email)

            // Insert into employees table if not exists
            const { error } = await supabase
                .from('employees')
                .upsert(
                    {
                        id: user.id,
                        name: user.user_metadata?.full_name || user.email,
                        email: user.email,

                    },
                    { onConflict: 'id' }
                )

            // if (error) console.error('❌ Sync failed:', error)
            // else console.log('✅ Synced employee record to DB')
            if (error) {
                console.error('❌ Sync failed:', error)
            } else {
                console.log('✅ Synced employee record to DB')

                // ✅ Fire only AFTER DB sync completes
                window.dispatchEvent(new Event("employee-synced"))
            }
        }

        // 1️⃣ Check immediately in case session already exists
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session) handleSession(data.session)
        })

        // 2️⃣ Listen for auth changes (OAuth redirects fire here)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) handleSession(session)
        })


        return () => {
            listener.subscription.unsubscribe()
        }
    }, [])

    return null
}
