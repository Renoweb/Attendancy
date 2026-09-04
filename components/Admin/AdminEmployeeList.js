'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function AdminEmployeeList({ employees }) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase()
        return (
            emp.name?.toLowerCase().includes(query) ||
            emp.email?.toLowerCase().includes(query) ||
            emp.role?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="space-y-6">
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search employees by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                />
            </div>

            {filteredEmployees.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No employees match your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((emp) => (
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
            )}
        </div>
    )
}
