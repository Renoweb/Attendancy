'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock, User, CheckCircle2, AlertCircle, ArrowRight, Inbox, Plus, SlidersHorizontal } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import TaskModal from './TaskModal'

const STATUS_CONFIG = {
    'todo': {
        label: 'Todo',
        color: '#4285F4',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Clock,
        dot: 'bg-blue-500',
    },
    'in_progress': {
        label: 'In Progress',
        color: '#FBBC05',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: ArrowRight,
        dot: 'bg-yellow-500',
    },
    'done': {
        label: 'Done',
        color: '#34A853',
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle2,
        dot: 'bg-green-500',
    },
    'future_planned': {
        label: 'Future Planned',
        color: '#EA4335',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertCircle,
        dot: 'bg-red-400',
    },
}

export default function TaskListView({ tasks, setTasks, labels, employees, currentUser }) {
    const [modalTask, setModalTask] = useState(null)
    const [sortBy, setSortBy] = useState('status') // 'status', 'due_date', 'created_at'

    const sortedTasks = useMemo(() => {
        const copy = [...tasks]
        if (sortBy === 'due_date') {
            return copy.sort((a, b) => {
                if (!a.due_date) return 1
                if (!b.due_date) return -1
                return dayjs(a.due_date).diff(dayjs(b.due_date))
            })
        }
        if (sortBy === 'status') {
            const order = ['in_progress', 'todo', 'future_planned', 'done']
            return copy.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
        }
        return copy.sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)))
    }, [tasks, sortBy])

    return (
        <div className="h-full w-full p-4 md:p-6 overflow-y-auto" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Your Tasks</h2>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned to you</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-center bg-gray-100 rounded-xl p-0.5 flex-1 sm:flex-none">
                        {[
                            { id: 'status', label: 'Status' },
                            { id: 'due_date', label: 'Due' },
                            { id: 'created_at', label: 'New' },
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSortBy(s.id)}
                                className={cn(
                                    "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                    sortBy === s.id
                                        ? "bg-white text-gray-800 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setModalTask({})}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Task</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* Task rows */}
            <div className="space-y-2 md:space-y-3">
                {sortedTasks.map(task => {
                    const config = STATUS_CONFIG[task.status] || STATUS_CONFIG['todo']
                    const StatusIcon = config.icon
                    const isOverdue = task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day') && task.status !== 'done'
                    const isDueSoon = task.due_date && dayjs(task.due_date).diff(dayjs(), 'day') <= 2 && dayjs(task.due_date).isAfter(dayjs()) && task.status !== 'done'

                    return (
                        <div
                            key={task.id}
                            onClick={() => setModalTask(task)}
                            className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                            {/* Mobile card layout */}
                            <div className="md:hidden flex items-stretch">
                                {/* Left status strip */}
                                <div
                                    className="w-1 shrink-0 rounded-l-xl"
                                    style={{ backgroundColor: config.color }}
                                />
                                <div className="flex-1 p-3 min-w-0">
                                    {/* Top row: Status + Due date */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border",
                                            config.bg, config.text, config.border
                                        )}>
                                            <StatusIcon className="w-3 h-3" />
                                            <span>{config.label}</span>
                                        </div>
                                        
                                        {task.due_date && (
                                            <div className={cn(
                                                "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ml-auto",
                                                isOverdue && "bg-red-50 text-red-600",
                                                isDueSoon && "bg-yellow-50 text-yellow-700",
                                                !isOverdue && !isDueSoon && "text-gray-400 bg-gray-50"
                                            )}>
                                                <Calendar className="w-3 h-3" />
                                                <span>{dayjs(task.due_date).format('MMM D')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
                                        {task.title}
                                    </h3>

                                    {/* Bottom row: Labels + Assignee */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                            {task.labels?.slice(0, 2).map(label => (
                                                <span
                                                    key={label.id}
                                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate"
                                                    style={{
                                                        backgroundColor: `${label.color}15`,
                                                        color: label.color,
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                            {task.labels?.length > 2 && (
                                                <span className="text-[9px] text-gray-400 font-semibold shrink-0">+{task.labels.length - 2}</span>
                                            )}
                                        </div>
                                        {task.assignee ? (
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shrink-0"
                                                style={{ backgroundColor: config.color }}
                                                title={`Assigned to ${task.assignee.name}`}
                                            >
                                                {task.assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                                                <User className="w-3 h-3 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Desktop row layout */}
                            <div className="hidden md:flex items-stretch">
                                {/* Left status strip */}
                                <div
                                    className="w-1.5 shrink-0 rounded-l-2xl"
                                    style={{ backgroundColor: config.color }}
                                />

                                {/* Main content area */}
                                <div className="flex-1 flex items-center gap-5 px-5 py-4 min-w-0">
                                    {/* Status badge */}
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border",
                                        config.bg, config.text, config.border
                                    )}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span>{config.label}</span>
                                    </div>

                                    {/* Title + description */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 text-[15px] leading-snug truncate group-hover:text-blue-600 transition-colors">
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[500px]">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Labels */}
                                    {task.labels?.length > 0 && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {task.labels.slice(0, 3).map(label => (
                                                <span
                                                    key={label.id}
                                                    className="text-[10px] font-bold px-2 py-1 rounded-md"
                                                    style={{
                                                        backgroundColor: `${label.color}15`,
                                                        color: label.color,
                                                        border: `1px solid ${label.color}25`
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                            {task.labels.length > 3 && (
                                                <span className="text-[10px] text-gray-400 font-semibold">+{task.labels.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Due date */}
                                    {task.due_date && (
                                        <div className={cn(
                                            "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0",
                                            isOverdue && "bg-red-50 text-red-600 border border-red-100",
                                            isDueSoon && "bg-yellow-50 text-yellow-700 border border-yellow-100",
                                            !isOverdue && !isDueSoon && "text-gray-500 bg-gray-50"
                                        )}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{dayjs(task.due_date).format('MMM D, YYYY')}</span>
                                        </div>
                                    )}

                                    {/* Assignee */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {task.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-sm"
                                                    style={{ backgroundColor: config.color }}
                                                    title={`Assigned to ${task.assignee.name}`}
                                                >
                                                    {task.assignee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 hidden lg:block">{task.assignee.name.split(' ')[0]}</span>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                                                <User className="w-3.5 h-3.5 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover arrow */}
                                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {sortedTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <Inbox className="w-6 h-6 md:w-7 md:h-7 text-blue-300" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-1">No tasks yet</h3>
                        <p className="text-xs md:text-sm text-gray-400 max-w-[280px]">Tasks assigned to you or created by you will appear here.</p>
                    </div>
                )}
            </div>

            {/* Task Details Modal */}
            {modalTask && (
                <TaskModal
                    task={Object.keys(modalTask).length === 0 ? null : modalTask}
                    onClose={() => setModalTask(null)}
                    labels={labels}
                    employees={employees}
                    currentUser={currentUser}
                    setTasks={setTasks}
                />
            )}
        </div>
    )
}
