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
                    className="cursor-pointer bg-white/50 backdrop-blur-xl p-6 rounded-2xl border border-white/30 shadow-md hover:shadow-xl hover:bg-white/70 transition-all duration-200"
                >
                    <h2 className="text-xl font-semibold text-blue-800">{emp.name}</h2>
                    <p className="text-gray-700 wrap-anywhere">{emp.email}</p>
                    <p className="text-sm text-blue-600 mt-2">{emp.role || 'No role assigned'}</p>
                </div>
            ))}
        </div>
    )
}
