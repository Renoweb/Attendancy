'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AdminEmployeeList from '@/components/Admin/AdminEmployeeList'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminPage() {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [employees, setEmployees] = useState([])
    const router = useRouter()

    useEffect(() => {
        const fetchAdminData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('/')
                return
            }

            const { data: emp, error } = await supabase
                .from('employees')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (error || !emp) {
                console.error('Error verifying admin:', error)
                router.replace('/')
                return
            }

            if (!emp.is_admin) {
                alert('Access denied — admin only!')
                router.replace('/')
                return
            }

            setIsAdmin(true)

            // Fetch all employees
            const { data: allEmployees, error: empErr } = await supabase
                .from('employees')
                .select('id, name, email, role')
                .order('created_at', { ascending: true })

            if (empErr) console.error(empErr)
            else setEmployees(allEmployees)

            setLoading(false)
        }

        fetchAdminData()
    }, [router])

    if (loading) return <div className="p-10 text-center text-gray-600 dark:text-gray-400">Loading admin dashboard...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-black dark:to-black p-10">
            <div className="max-w-6xl mx-auto bg-white/40 dark:bg-[#0a0a0a] backdrop-blur-2xl shadow-xl rounded-3xl p-8 border border-white/30 dark:border-[#1a1a1a]">
                <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-8 text-center">Admin Dashboard</h1>
                <AdminEmployeeList employees={employees} />
            </div>
            <ThemeToggle />
        </div>
    )
}

