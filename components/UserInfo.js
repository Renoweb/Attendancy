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
    // console.log('User Data:', userData)

    if (!userData) return null

    return (
        <div
            className="w-full
        lg:w-3/12  mt-20 lg:mt-5 ml-5
        flex items-center gap-4
        px-4 py-2
        rounded-2xl border border-white/30
        backdrop-blur-2xl 
        shadow-lg
        hover:bg-white/30 transition-all duration-300
      "
        >
            <Image
                width={200}
                height={200}
                src={userData.avatar}
                alt="User Avatar"
                className="w-12 h-12 rounded-full border border-white/50 shadow-sm object-cover"
            />

            <div className="flex flex-col leading-tight">
                <span className="text-blue-800 font-semibold text-lg">
                    {userData.name}
                </span>
                <span className="text-gray-600 text-sm max-w-[160px]">
                    {userData.email}
                </span>
            </div>
        </div>
    )
}
