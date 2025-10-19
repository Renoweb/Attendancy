'use client'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signOut()
        setLoading(false)

        if (error) {
            console.error('Logout failed:', error)
            alert('Something went wrong while logging out.')
            return
        }

        // Redirect to home/login page
        router.push('/')
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`
        absolute top-6 right-6 z-50
        flex items-center gap-2
        px-5 py-2.5 rounded-xl font-semibold
        text-white bg-blue-600
        hover:bg-blue-700 active:scale-95
        disabled:bg-gray-400
        transition-all duration-200
        shadow-md hover:shadow-lg
      `}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
            </svg>

            {loading ? 'Logging out...' : 'Logout'}
        </button>
    )
}
