'use client'

import GlassCard from "./GlassCard"

export default function StatsCard({ count, label }) {
    return (
        <GlassCard className="flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-blue-600">{count}</div>
            <div className="text-sm text-gray-700 mt-1">{label}</div>
        </GlassCard>
    )
}
