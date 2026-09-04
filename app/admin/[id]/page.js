'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AdminEmployeeDetail from '@/components/Admin/AdminEmployeeDetail'
import ThemeToggle from '@/components/ThemeToggle'
import ArchiveEmployeeButton from '@/components/Admin/ArchiveEmployeeButton'


export default function AdminEmployeePage() {
    const router = useRouter()
    const params = useParams()
    const [employee, setEmployee] = useState(null)
    const [attendance, setAttendance] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('/')
                return
            }

            // Check if admin
            const { data: adminData } = await supabase
                .from('employees')
                .select('is_admin, is_archived')
                .eq('id', user.id)
                .single()
            if (adminData?.is_archived) {
                alert('Your account is archived.')
                await supabase.auth.signOut()
                router.replace('/')
                return
            }
            if (!adminData?.is_admin) {
                alert('Access denied — admin only!')
                router.replace('/')
                return
            }

            // Fetch employee info
            const { data: emp } = await supabase
                .from('employees')
                .select('id, name, email, role, is_archived')
                .eq('id', params.id)
                .single()

            // Fetch attendance
            const { data: att } = await supabase
                .from('attendance')
                .select('date, status, work_summary')
                .eq('user_id', params.id)
                .order('date', { ascending: true })

            setEmployee(emp)
            setAttendance(att || [])
            setLoading(false)
        }

        fetchData()
    }, [params.id, router])

    if (loading) return <div className="p-10 text-center text-gray-600 dark:text-gray-400">Loading employee data...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-black dark:to-black p-10">
            <div className="max-w-5xl mx-auto bg-white/40 dark:bg-[#0a0a0a] backdrop-blur-2xl shadow-xl rounded-3xl p-8 border border-white/30 dark:border-[#1a1a1a]">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        ← Back
                    </button>
                    {employee && (
                        <div className="flex items-center gap-4">
                            {employee.is_archived && (
                                <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                    Archived
                                </span>
                            )}
                            <ArchiveEmployeeButton employeeId={employee.id} isArchived={employee.is_archived} />
                        </div>
                    )}
                </div>

                <AdminEmployeeDetail employee={employee} attendance={attendance} />
            </div>
            <ThemeToggle />
        </div>
    )
}

