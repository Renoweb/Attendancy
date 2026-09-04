'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AdminEmployeeList from '@/components/Admin/AdminEmployeeList'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationTray from '@/components/Admin/NotificationTray'
import Link from 'next/link'
import { BarChart3, TrendingUp, Archive } from 'lucide-react'

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
                .select('is_admin, is_archived')
                .eq('id', user.id)
                .single()

            if (error || !emp) {
                console.error('Error verifying admin:', error)
                router.replace('/')
                return
            }

            if (emp.is_archived) {
                alert('Your account is archived.')
                await supabase.auth.signOut()
                router.replace('/')
                return
            }

            if (!emp.is_admin) {
                alert('Access denied — admin only!')
                router.replace('/')
                return
            }

            setIsAdmin(true)

            // Fetch all employees (active)
            const { data: allEmployees, error: empErr } = await supabase
                .from('employees')
                .select('id, name, email, role')
                .eq('is_archived', false)
                .order('name', { ascending: true })

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
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-400 text-center sm:text-left">Admin Dashboard</h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin/hours-report" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-semibold text-sm">Weekly Hours</span>
                        </Link>
                        <Link href="/admin/rate-report" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-semibold text-sm">Working Rate Trends</span>
                        </Link>
                        <Link href="/admin/archived" className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                            <Archive className="w-5 h-5" />
                            <span className="font-semibold text-sm">Archived</span>
                        </Link>
                        <NotificationTray />
                    </div>
                </div>
                <AdminEmployeeList employees={employees} />
            </div>
            <ThemeToggle />
        </div>
    )
}

