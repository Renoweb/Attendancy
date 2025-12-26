'use client'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPanel() {
    const router = useRouter()
    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) router.replace('/dashboard')
        }
        check()
    }, [router])
    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/dashboard' },
        })
    }

    return (
        <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-10 space-y-10 lg:space-y-0">
            {/* Glass login panel */}
            <div className="backdrop-blur-2xl bg-white/25 shadow-2xl rounded-3xl p-8 sm:p-10 lg:p-12 w-full lg:w-1/2 border border-white/40 text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-6 text-blue-600 drop-shadow-sm">
                    Welcome Back
                </h1>
                <p className="text-gray-700 mb-8 sm:mb-10 max-w-md mx-auto lg:mx-0 font-medium">
                    Sign in securely with your company Google account to access your attendance dashboard.
                </p>
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center justify-center lg:justify-start space-x-3 sm:space-x-4 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-200 cursor-pointer w-full sm:w-auto mx-auto lg:mx-0"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full"
                    />
                    <span>Sign in with Google</span>
                </button>
            </div>

            {/* Right logo */}
            <div className="flex justify-center items-center w-full lg:w-1/2">
                <div className="backdrop-blur-2xl bg-white/20 p-8 sm:p-10 rounded-3xl border border-white/30 shadow-lg">
                    <img
                        src="/renoweb_logo.png"
                        alt="Company Logo"
                        className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 object-contain drop-shadow-2xl"
                    />
                    <h1 className="text-3xl md:text-[50px] font-bold text-[#308fef] drop-shadow-sm text-center">Renoweb</h1>
                    <h4 className="text-center text-xl md:text-[20px] font-bold text-[#023dbb] ">Digital Solutions</h4>
                </div>
            </div>
        </div>

    )
}
