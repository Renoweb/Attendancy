'use client'

import { LayoutGrid, User, CalendarDays, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const GOOGLE_COLORS = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
}

export default function KanbanSidebar({ filter, setFilter, taskCount = 0, myTaskCount = 0, isOpen, onClose }) {
    const navItems = [
        { id: 'all', label: 'All Tasks', icon: LayoutGrid, count: taskCount, color: GOOGLE_COLORS.blue },
        { id: 'mine', label: 'Your Tasks', icon: User, count: myTaskCount, color: GOOGLE_COLORS.green },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays, count: null, color: GOOGLE_COLORS.yellow },
    ]

    const handleFilterChange = (id) => {
        setFilter(id)
        if (onClose) onClose()
    }

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                // Base styles
                "shrink-0 border-r border-gray-100 bg-white p-5 flex flex-col z-50 transition-transform duration-300 ease-in-out",
                // Desktop: always visible, static positioning
                "md:relative md:translate-x-0 md:w-[260px]",
                // Mobile: fixed overlay drawer
                "fixed inset-y-0 left-0 w-[280px] shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Mobile close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Sidebar Header */}
                <div className="flex items-center gap-2.5 mb-8 px-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOOGLE_COLORS.blue}, ${GOOGLE_COLORS.green})` }}>
                        <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-800 leading-none">Task Board</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Manage your work</p>
                    </div>
                </div>

                <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.15em] mb-3 px-3">Views</p>

                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = filter === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleFilterChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                )}
                                style={isActive ? { backgroundColor: `${item.color}12`, } : {}}
                            >
                                <div
                                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                                        isActive ? "" : "bg-gray-100 group-hover:bg-gray-200"
                                    )}
                                    style={isActive ? { backgroundColor: `${item.color}22` } : {}}
                                >
                                    <item.icon
                                        className="w-3.5 h-3.5 transition-colors"
                                        style={{ color: isActive ? item.color : undefined }}
                                    />
                                </div>
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.count !== null && (
                                    <span
                                        className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                                            isActive ? "text-white" : "bg-gray-100 text-gray-400"
                                        )}
                                        style={isActive ? { backgroundColor: item.color } : {}}
                                    >
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Bottom decorative element */}
                <div className="mt-auto pt-6">
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-green-50 p-4 border border-blue-100/50">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Quick Tip</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">Drag and drop cards between columns to update their status.</p>
                    </div>
                </div>
            </div>
        </>
    )
}
