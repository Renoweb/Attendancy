// 'use client'
// import { useEffect } from 'react'
// import { supabase } from '@/lib/supabaseClient'

// export default function AuthSync() {
//     useEffect(() => {
//         const syncUser = async () => {
//             const { data: { user } } = await supabase.auth.getUser()
//             if (!user) return

//             // Upsert user into employees table
//             const { error } = await supabase
//                 .from('employees')
//                 .upsert(
//                     {
//                         id: user.id,
//                         name: user.user_metadata.full_name || user.email,
//                         email: user.email,
//                         role: 'Employee', // default role
//                     },
//                     { onConflict: 'id' } // ensures only one entry per user
//                 )

//             if (error) console.error('Error syncing employee record:', error)
//             else console.log('✅ Employee synced to employees table')
//         }

//         syncUser()
//     }, [])

//     return null
// }

// 'use client'
// import { useEffect } from 'react'
// import { supabase } from '@/lib/supabaseClient'

// export default function AuthSync() {
//     useEffect(() => {
//         const syncUser = async () => {
//             try {
//                 // 1) get session+user
//                 const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
//                 if (sessErr) {
//                     console.error('auth.getSession error', sessErr)
//                     return
//                 }
//                 const user = sessionData?.data?.session?.user
//                 // fallback if using older supabase-js:
//                 // const { data: { user } } = await supabase.auth.getUser()

//                 if (!user) {
//                     console.log('no user session found; skipping sync')
//                     return
//                 }

//                 console.log('AuthSync: user found', { id: user.id, email: user.email, meta: user.user_metadata })

//                 // 2) Check existing employee row (helps debug RLS)
//                 const { data: existing, error: selErr } = await supabase
//                     .from('employees')
//                     .select('id, email, name')
//                     .eq('id', user.id)
//                     .limit(1)
//                     .maybeSingle()

//                 if (selErr) {
//                     console.warn('AuthSync: select error (possible RLS):', selErr)
//                 } else if (existing) {
//                     console.log('AuthSync: employee record already exists', existing)
//                     return
//                 }

//                 // 3) Try upsert (insert) - rely on onConflict:'id' to avoid duplicates
//                 const payload = {
//                     id: user.id,
//                     name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
//                     email: user.email,
//                     role: 'Employee',
//                 }

//                 const { data, error } = await supabase
//                     .from('employees')
//                     .upsert(payload, { onConflict: 'id' })

//                 if (error) {
//                     console.error('AuthSync: upsert error:', error)
//                     // helpful tip: check error.details / error.hint / error.message
//                     return
//                 }

//                 console.log('✅ Employee synced to employees table', data)
//             } catch (e) {
//                 console.error('AuthSync unexpected exception:', e)
//             }
//         }

//         syncUser()
//     }, [])

//     return null
// }

'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthSync() {
    useEffect(() => {
        const handleSession = async (session) => {
            if (!session?.user) {
                console.log('AuthSync: still no session, waiting...')
                return
            }

            const user = session.user
            console.log('AuthSync: user session ready →', user.email)

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

            if (error) console.error('❌ Sync failed:', error)
            else console.log('✅ Synced employee record to DB')
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
