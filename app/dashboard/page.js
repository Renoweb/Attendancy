'use client'

import AttendanceSection from "@/components/AttendanceSection"
import CalendarSection from "@/components/CalendarSection"
import HeaderBanner from "@/components/HeaderBanner"
import LogoutButton from "@/components/LogoutButton"
import OnboardingModal from "@/components/OnboardingModal"
import StatsCard from "@/components/StatsCard"
import UserInfo from "@/components/UserInfo"
import AuthSync from "@/lib/AuthSync"
import { supabase } from "@/lib/supabaseClient"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function DashboardPageWrapper({ children }) {
    const router = useRouter()

    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) router.replace('/')
        }
        check()
    }, [router])

    return <>{children}</>
}


export default function DashboardPage() {
    const [stats, setStats] = useState({ holidays: 0, attendance: 0, missed: 0 });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true)

    const router = useRouter()

    useEffect(() => {
        const loadStats = async (month = dayjs()) => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if admin
            const { data: emp } = await supabase
                .from('employees')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            if (emp?.is_admin) setIsAdmin(true)

            // 🗓️ Use selected month (from calendar)
            const startOfMonth = month.startOf('month').format('YYYY-MM-DD')
            const endOfMonth = month.endOf('month').format('YYYY-MM-DD')

            // 🎉 Count holidays
            const { data: holidays } = await supabase
                .from('holidays')
                .select('date')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)

            // ✅ Count attendance
            const { data: attendance } = await supabase
                .from('attendance')
                .select('date')
                .eq('user_id', user.id)
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)

            const holidaysCount = holidays?.length || 0
            const attendanceCount = attendance?.length || 0

            // 🧮 Calculate missed days
            const today = dayjs()
            const isCurrentMonth = today.isSame(month, 'month')
            const totalDaysInScope = isCurrentMonth
                ? today.date() // only up to today for current month
                : month.endOf('month').date() // full month for past months

            const missed = totalDaysInScope - attendanceCount - holidaysCount

            setStats({
                holidays: holidaysCount,
                attendance: attendanceCount,
                missed: missed < 0 ? 0 : missed,
            })
            setLoading(false);
        }

        // 🔹 Initial load (for current month)
        loadStats()

        // 🔁 When attendance is marked
        const handleAttendanceMarked = () => {
            console.log('📅 Attendance marked → refreshing stats...')
            loadStats()
        }

        // 🔁 When calendar month changes
        const handleMonthChanged = (e) => {
            const monthString = e.detail // e.g. "2025-10"
            const selectedMonth = dayjs(monthString, 'YYYY-MM')
            console.log('🗓️ Month changed →', selectedMonth.format('MMMM YYYY'))
            loadStats(selectedMonth)
        }

        window.addEventListener('attendance-marked', handleAttendanceMarked)
        window.addEventListener('month-changed', handleMonthChanged)

        return () => {
            window.removeEventListener('attendance-marked', handleAttendanceMarked)
            window.removeEventListener('month-changed', handleMonthChanged)
        }
    }, [])





    return (
        <DashboardPageWrapper >
            {isAdmin && (
                <button
                    onClick={() => router.push('/admin')}
                    className="absolute top-6 lg:top-22 left-6 lg:left-auto lg:right-6 z-50
        flex items-center gap-2
        px-5 py-2.5 rounded-xl font-semibold
        text-white bg-blue-600
        hover:bg-blue-700 active:scale-95
        disabled:bg-gray-400
        transition-all duration-200
        shadow-md hover:shadow-lg"
                >
                    Go to Admin Panel
                </button>
            )}

            <UserInfo />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-12 px-4">
                <OnboardingModal />
                <LogoutButton />
                <AuthSync />
                <div className="w-full max-w-5xl space-y-8">
                    <HeaderBanner />

                    {/* Stats row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* <StatsCard count={5} label="This Month Present" /> */}
                        <StatsCard loading={loading} count={stats.holidays} label="Holidays" />
                        <StatsCard loading={loading} count={stats.attendance} label="Total Attendance" />
                        <StatsCard loading={loading} count={stats.missed} label="Missed Days" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AttendanceSection />
                        <CalendarSection />
                    </div>
                </div>
            </div>
        </DashboardPageWrapper>
    )
}
