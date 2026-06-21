'use client'
import { useRouter } from 'next/navigation'

export default function AdminEmployeeList({ employees }) {
    const router = useRouter()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
                <div
                    key={emp.id}
                    onClick={() => router.push(`/admin/${emp.id}`)}
                    className="cursor-pointer bg-white/50 dark:bg-[#0a0a0a] backdrop-blur-xl p-6 rounded-2xl border border-white/30 dark:border-[#222222] shadow-md hover:shadow-xl dark:hover:border-[#333333] hover:bg-white/70 dark:hover:bg-[#111111] transition-all duration-200"
                >
                    <h2 className="text-xl font-semibold text-blue-800 dark:text-white">{emp.name}</h2>
                    <p className="text-gray-700 dark:text-gray-400 wrap-anywhere">{emp.email}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{emp.role || 'No role assigned'}</p>
                </div>
            ))}
        </div>
    )
}
