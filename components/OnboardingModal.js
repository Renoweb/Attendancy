'use client'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'

const ROLE_OPTIONS = {
    employees: {
        "Graphic Designer": ["Intern", "Junior", "Senior", "Head"],
        "Web Developer": ["Intern", "Junior", "Senior", "Head"],
        "Video Editor": ["Intern", "Junior", "Senior", "Head"],
        "BDE": ["Intern", "Junior", "Senior", "Head"],
        "SMM": ["Intern", "Junior", "Senior", "Head"],
        "UI/UX Designer": ["Intern", "Junior", "Senior", "Head"],
        "AI Software Engineer": ["Intern", "Junior", "Senior", "Head"],
        "SEO": ["Intern", "Junior", "Senior", "Head"],
        "Funnel and Performance Marketer": ["Intern", "Junior", "Senior", "Head"],
        "Appointment Setter": ["Intern", "Junior", "Senior"],
        "Closer": ["Intern", "Junior", "Senior"],
        "Outbound Sales": ["Head"],
        "Legal Assistant": ["Intern", "Junior", "Senior"],
        "Operations & Internal Project Manager": ["Junior"],
        "Operations & Internal Manager": ["Senior"],
        "Customer Delight Executive & External Project Manager": ["Junior", "Senior"],
        "Content Strategist": ["Intern", "Junior", "Senior"],
        "Data Scraper & Lead Generator": ["Intern", "Junior", "Senior"],
        "COO": [],
        "CTO": [],
        "CFO": [],
        "CEO": []
    },
    freelancers: [
        "Graphic Designer",
        "Video Editor",
        "SEO",
        "Corporate Legal Executive",
        "UI/UX Designer",
        "Web Developer",
        "Funnel and Performance Marketer"
    ]
};


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

                {/* <select
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
                </select> */}
                <select
                    className="w-full mb-6 px-4 py-3 rounded-xl border border-white/40 bg-white/10 text-gray-800"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="">Select your role</option>

                    {/* Employees */}
                    <optgroup label="Employees">
                        {Object.entries(ROLE_OPTIONS.employees).map(([title, levels]) =>
                            levels.length > 0 ? (
                                levels.map(level => (
                                    <option key={`${title}-${level}`} value={`${title} — ${level}`}>
                                        {title} — {level}
                                    </option>
                                ))
                            ) : (
                                <option key={title} value={title}>
                                    {title}
                                </option>
                            )
                        )}
                    </optgroup>

                    {/* Freelancers */}
                    <optgroup label="Freelancers">
                        {ROLE_OPTIONS.freelancers.map(f => (
                            <option key={f} value={`${f} — Freelancer`}>
                                {f} — Freelancer
                            </option>
                        ))}
                    </optgroup>
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
