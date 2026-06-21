'use client'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import DarkModeAnnouncement from './DarkModeAnnouncement'

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <>
            <DarkModeAnnouncement />
            <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`
                    fixed bottom-6 right-6 z-50
                    w-12 h-12 rounded-full
                    flex items-center justify-center
                    shadow-lg hover:shadow-xl
                    transition-all duration-300
                    active:scale-90
                    ${isDark
                        ? 'bg-[#1a1a1a] border border-[#333333] text-yellow-400 hover:bg-[#222222]'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                `}
            >
                {isDark ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>
        </>
    )
}
