'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AdminEmployeeDetail from '@/components/Admin/AdminEmployeeDetail'


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
                .select('is_admin')
                .eq('id', user.id)
                .single()
            if (!adminData?.is_admin) {
                alert('Access denied — admin only!')
                router.replace('/')
                return
            }

            // Fetch employee info
            const { data: emp } = await supabase
                .from('employees')
                .select('id, name, email, role')
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

    if (loading) return <div className="p-10 text-center text-gray-600">Loading employee data...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-10">
            <div className="max-w-5xl mx-auto bg-white/40 backdrop-blur-2xl shadow-xl rounded-3xl p-8 border border-white/30">
                <button
                    onClick={() => router.back()}
                    className="mb-6 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    ← Back
                </button>

                <AdminEmployeeDetail employee={employee} attendance={attendance} />
            </div>
        </div>
    )
}
