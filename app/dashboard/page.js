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
    useEffect(() => {
        const loadStats = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get current month range
            const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
            const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

            // 🎉 Count holidays in this month
            const { data: holidays } = await supabase
                .from('holidays')
                .select('date')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)

            // ✅ Count attendance entries
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
            const totalDaysUntilToday = today.date() // days passed in month
            const missed = totalDaysUntilToday - attendanceCount - holidaysCount

            setStats({
                holidays: holidaysCount,
                attendance: attendanceCount,
                missed: missed < 0 ? 0 : missed,
            })
        }

        loadStats()
    }, [])
    return (
        <DashboardPageWrapper >
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
                        <StatsCard count={stats.holidays} label="Holidays" />
                        <StatsCard count={stats.attendance} label="Total Attendance" />
                        <StatsCard count={stats.missed} label="Missed Days" />
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
