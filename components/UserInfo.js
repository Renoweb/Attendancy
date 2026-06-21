'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function UserInfo() {
    const [userData, setUserData] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserData({
                    name: user.user_metadata?.full_name || user.email,
                    avatar: user.user_metadata?.avatar_url || '/default-avatar.png',
                    email: user.email,
                })
            }
        }

        fetchUser()
    }, [])

    if (!userData) return null

    return (
        <div
            className="
                /* Fixed width on mobile (max-width of screen minus margins) */
                w-[calc(100%-2.5rem)] 
                lg:w-3/12 
                mt-20 lg:mt-5 ml-5
                flex items-center gap-4
                px-4 py-2
                rounded-2xl border border-white/30 dark:border-[#222222]
                backdrop-blur-2xl dark:bg-[#111111]
                shadow-lg
                hover:bg-white/30 dark:hover:bg-[#1a1a1a] transition-all duration-300
                /* Prevent container from growing beyond its parent */
                overflow-hidden
            "
        >
            <Image
                width={200}
                height={200}
                src={userData.avatar}
                alt="User Avatar"
                className="w-12 h-12 flex-shrink-0 rounded-full border border-white/50 dark:border-[#333333] shadow-sm object-cover"
            />

            <div className="flex flex-col leading-tight min-w-0">
                <span className="text-blue-800 dark:text-white font-semibold text-lg truncate">
                    {userData.name}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm break-words">
                    {userData.email}
                </span>
            </div>
        </div>
    )
}
