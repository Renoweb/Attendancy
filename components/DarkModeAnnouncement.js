'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

export default function DarkModeAnnouncement() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Expiration date (2 days from now — June 23/24)
        const expirationDate = dayjs('2026-06-24')
        if (dayjs().isAfter(expirationDate)) {
            return
        }

        const hasSeen = localStorage.getItem('darkModeAnnouncementSeen')
        if (!hasSeen) {
            setShow(true)
        }
    }, [])

    const handleAcknowledge = () => {
        localStorage.setItem('darkModeAnnouncementSeen', 'true')
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40 px-4">
            <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-200 dark:border-[#222222] transform transition-all">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-[#333333]">
                    <span className="text-3xl">🌙</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Dark Mode is Here!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    You can now switch to a beautiful pitch-black dark mode for better focus and reduced eye strain. Toggle it using the icon in the bottom right corner.
                </p>
                <button
                    onClick={handleAcknowledge}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                    Awesome, Got It!
                </button>
            </div>
        </div>
    )
}
