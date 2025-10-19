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
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatsCard count={5} label="This Month Present" />
                        <StatsCard count={2} label="Holidays" />
                        <StatsCard count={20} label="Total Attendance" />
                        <StatsCard count={0} label="Missed Days" />
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
