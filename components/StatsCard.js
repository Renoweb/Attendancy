'use client'
export default function StatsCard({ count, label, loading }) {
    return (
        <div className="bg-white/50 backdrop-blur-lg border border-white/30 shadow-md rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300">
            {loading ? (
                <div className="flex justify-center items-center h-16">
                    {/* Tailwind-based spinner */}
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <h2 className="text-3xl font-bold text-blue-700">{count}</h2>
            )}
            <p className="mt-2 text-gray-700 font-medium">{label}</p>
        </div>
    )
}
