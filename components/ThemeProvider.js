'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} })

export function useTheme() {
    return useContext(ThemeContext)
}

export default function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('theme')
        const dark = stored === 'dark'
        setIsDark(dark)
        if (dark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev
            localStorage.setItem('theme', next ? 'dark' : 'light')
            if (next) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
            return next
        })
    }

    // Prevent flash: render children only after reading localStorage
    if (!mounted) {
        return null
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
