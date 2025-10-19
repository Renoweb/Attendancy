'use client'
export default function GlassCard({ children, className = '' }) {
    return (
        <div
            className={`
        bg-white/20 backdrop-blur-md border border-white/30
        shadow-lg rounded-2xl p-6 ${className}
      `}
        >
            {children}
        </div>
    )
}
