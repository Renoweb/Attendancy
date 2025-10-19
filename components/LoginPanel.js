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
        <div className="relative z-10 flex w-full max-w-6xl items-center justify-between px-10">
            {/* Glass login panel */}
            <div className="backdrop-blur-2xl bg-white/25 shadow-2xl rounded-3xl p-12 w-1/2 border border-white/40">
                <h1 className="text-5xl font-bold mb-6 text-blue-600 drop-shadow-sm">Welcome Back</h1>
                <p className="text-gray-700 mb-10 max-w-md font-medium">
                    Sign in securely with your company Google account to access your attendance dashboard.
                </p>
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center space-x-4 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-200 cursor-pointer"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-7 h-7 bg-white rounded-full"
                    />
                    <span>Sign in with Google</span>
                </button>
            </div>

            {/* Right logo */}
            <div className="flex justify-center items-center w-1/2">
                <div className="backdrop-blur-2xl bg-white/20 p-10 rounded-3xl border border-white/30 shadow-lg">
                    <img
                        src="/renoweb_logo.png"
                        alt="Company Logo"
                        className="w-64 h-64 object-contain drop-shadow-2xl"
                    />
                </div>
            </div>
        </div>
    )
}
