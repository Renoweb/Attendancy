// 'use client'
// import { supabase } from '@/lib/supabaseClient'
// import { useState, useEffect } from 'react'


// export default function OnboardingModal() {
//     const [open, setOpen] = useState(false)
//     const [role, setRole] = useState('')
//     const [loading, setLoading] = useState(false)
//     const [userId, setUserId] = useState(null)

//     // 🔹 Check if user is new (no role yet)
//     useEffect(() => {
//         const checkNewUser = async () => {
//             const { data: { user } } = await supabase.auth.getUser()
//             if (!user) return

//             setUserId(user.id)

//             // Fetch their employee record
//             const { data, error } = await supabase
//                 .from('employees')
//                 .select('role')
//                 .eq('id', user.id)
//                 .single()

//             if (error) {
//                 console.error('Error fetching employee role:', error)
//                 return
//             }

//             if (!data?.role) {
//                 setOpen(true) // Show modal if no role found
//             }
//         }

//         checkNewUser()
//     }, [])

//     // 🔹 Handle submission
//     const handleSaveRole = async () => {
//         if (!role.trim()) return alert('Please select your role')
//         setLoading(true)

//         const { error } = await supabase
//             .from('employees')
//             .update({ role })
//             .eq('id', userId)

//         setLoading(false)

//         if (error) {
//             console.error('Failed to update role:', error)
//             alert('Something went wrong. Please try again.')
//             return
//         }

//         setOpen(false)
//     }

//     if (!open) return null

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-white/10">
//             <div className="bg-white/20 backdrop-blur-2xl border border-white/30 p-8 rounded-3xl shadow-2xl w-[400px] text-center">
//                 <h2 className="text-2xl font-semibold text-blue-700 mb-4">Welcome to Renoweb 👋</h2>
//                 <p className="text-gray-700 mb-6">
//                     Before continuing, please tell us your role in the company.
//                 </p>

//                 <select
//                     className="w-full mb-6 px-4 py-3 rounded-xl border border-white/40 bg-white/10 text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none"
//                     value={role}
//                     onChange={(e) => setRole(e.target.value)}
//                 >
//                     <option value="">Select your role</option>
//                     <option value="Developer">Developer</option>
//                     <option value="Designer">Designer</option>
//                     <option value="Manager">Manager</option>
//                     <option value="HR">HR</option>
//                     <option value="Marketing">Marketing</option>
//                     <option value="Other">Other</option>
//                 </select>

//                 <button
//                     onClick={handleSaveRole}
//                     disabled={loading}
//                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all disabled:bg-gray-400"
//                 >
//                     {loading ? 'Saving...' : 'Save & Continue'}
//                 </button>
//             </div>
//         </div>
//     )
// }

'use client'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'

export default function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const [role, setRole] = useState('')
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(null)

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data, error } = await supabase
            .from('employees')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!error && !data?.role) {
            setOpen(true)
        }
    }

    useEffect(() => {
        // Run immediately
        checkUserRole()

        // ✅ If AuthSync just created row → check again
        const handler = () => {
            console.log("✅ Employee synced event received")
            checkUserRole()
        }

        window.addEventListener("employee-synced", handler)
        return () => window.removeEventListener("employee-synced", handler)
    }, [])

    const handleSaveRole = async () => {
        if (!role.trim()) return alert('Please select your role')
        setLoading(true)

        const { error } = await supabase
            .from('employees')
            .update({ role })
            .eq('id', userId)

        setLoading(false)

        if (error) return alert('Something went wrong. Try again.')
        setOpen(false)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-white/10">
            <div className="bg-white/20 backdrop-blur-2xl border border-white/30 p-8 rounded-3xl shadow-2xl w-[400px] text-center">
                <h2 className="text-2xl font-semibold text-blue-700 mb-4">Welcome 👋</h2>
                <p className="text-gray-700 mb-6">Before continuing, please tell us your role.</p>

                <select
                    className="w-full mb-6 px-4 py-3 rounded-xl border border-white/40 bg-white/10 text-gray-800"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="">Select your role</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                </select>

                <button
                    onClick={handleSaveRole}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all disabled:bg-gray-400"
                >
                    {loading ? 'Saving...' : 'Save & Continue'}
                </button>
            </div>
        </div>
    )
}
