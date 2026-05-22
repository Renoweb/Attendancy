'use client'

import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import TaskModal from './TaskModal'
import { cn } from '@/lib/utils'

dayjs.extend(isoWeek)

const STATUS_COLORS = {
    'todo': { label: 'Todo', bg: '#4285F4', text: '#fff', light: '#e8f0fe', border: '#c6dafc' },
    'in_progress': { label: 'In Progress', bg: '#FBBC05', text: '#fff', light: '#fef7e0', border: '#fde68a' },
    'done': { label: 'Done', bg: '#34A853', text: '#fff', light: '#e6f4ea', border: '#a8dab5' },
    'future_planned': { label: 'Future Planned', bg: '#EA4335', text: '#fff', light: '#fce8e6', border: '#f5c6cb' },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function KanbanCalendar({ tasks, setTasks, labels, employees, currentUser }) {
    const [currentMonth, setCurrentMonth] = useState(dayjs())
    const [selectedDate, setSelectedDate] = useState(dayjs())
    const [modalTask, setModalTask] = useState(null)
    const [view, setView] = useState('month') // 'month' | 'week'

    const myTasks = useMemo(() => {
        if (!currentUser) return []
        return tasks.filter(t => t.assignee_id === currentUser.id || t.creator_id === currentUser.id)
    }, [tasks, currentUser])

    const tasksByDate = useMemo(() => {
        const groups = {}
        myTasks.forEach(task => {
            if (task.due_date) {
                const dateStr = dayjs(task.due_date).format('YYYY-MM-DD')
                if (!groups[dateStr]) groups[dateStr] = []
                groups[dateStr].push(task)
            }
        })
        return groups
    }, [myTasks])

    const calendarDays = useMemo(() => {
        if (view === 'week') {
            const startOfWeek = selectedDate.startOf('week')
            return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
        }

        const startOfMonth = currentMonth.startOf('month')
        const endOfMonth = currentMonth.endOf('month')
        const startDay = startOfMonth.startOf('week')
        const endDay = endOfMonth.endOf('week')

        const days = []
        let day = startDay
        while (day.isBefore(endDay) || day.isSame(endDay, 'day')) {
            days.push(day)
            day = day.add(1, 'day')
        }
        return days
    }, [currentMonth, selectedDate, view])

    const navigatePrev = () => {
        if (view === 'week') {
            setSelectedDate(prev => prev.subtract(1, 'week'))
        } else {
            setCurrentMonth(prev => prev.subtract(1, 'month'))
        }
    }

    const navigateNext = () => {
        if (view === 'week') {
            setSelectedDate(prev => prev.add(1, 'week'))
        } else {
            setCurrentMonth(prev => prev.add(1, 'month'))
        }
    }

    const goToToday = () => {
        setCurrentMonth(dayjs())
        setSelectedDate(dayjs())
    }

    const selectedDateStr = selectedDate.format('YYYY-MM-DD')
    const selectedDateTasks = tasksByDate[selectedDateStr] || []
    const todayStr = dayjs().format('YYYY-MM-DD')

    const getHeaderTitle = () => {
        if (view === 'week') {
            const startOfWeek = selectedDate.startOf('week')
            const endOfWeek = selectedDate.endOf('week')
            if (startOfWeek.month() === endOfWeek.month()) {
                return `${startOfWeek.format('MMM D')} – ${endOfWeek.format('D, YYYY')}`
            }
            return `${startOfWeek.format('MMM D')} – ${endOfWeek.format('MMM D, YYYY')}`
        }
        return currentMonth.format('MMMM YYYY')
    }

    // Task detail card component (shared between mobile and desktop)
    const TaskDetailCard = ({ task }) => {
        const sc = STATUS_COLORS[task.status] || STATUS_COLORS['todo']
        const isOverdue = task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day') && task.status !== 'done'

        return (
            <div
                onClick={() => setModalTask(task)}
                className="p-3.5 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sc.bg }}
                    />
                    <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: sc.bg }}
                    >
                        {sc.label}
                    </span>
                    {isOverdue && (
                        <span className="text-[9px] font-bold uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded ml-auto">
                            Overdue
                        </span>
                    )}
                </div>

                <h5 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-600 transition-colors mb-1.5">
                    {task.title}
                </h5>

                {task.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-normal mb-2">
                        {task.description}
                    </p>
                )}

                {task.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {task.labels.map(label => (
                            <span
                                key={label.id}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                    backgroundColor: `${label.color}18`,
                                    color: label.color,
                                }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {task.assignee && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-50">
                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: sc.bg }}
                        >
                            {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{task.assignee.name}</span>
                    </div>
                )}
            </div>
        )
    }

    // Status legend component
    const Legend = () => (
        <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg }} />
                    <span className="text-[10px] font-medium text-gray-500">{colors.label}</span>
                </div>
            ))}
        </div>
    )

    return (
        <div className="h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            
            {/* ===== MOBILE TOP BAR ===== */}
            <div className="md:hidden flex flex-col border-b border-gray-200 bg-white">
                {/* Row 1: Title + nav */}
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={navigatePrev}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-base font-bold text-gray-800 min-w-[140px] text-center">
                            {view === 'month' ? currentMonth.format('MMM YYYY') : getHeaderTitle()}
                        </h3>
                        <button
                            onClick={navigateNext}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600 active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={goToToday}
                            className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95"
                        >
                            Today
                        </button>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setView('week')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                                    view === 'week' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                                )}
                            >
                                W
                            </button>
                            <button
                                onClick={() => setView('month')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                                    view === 'month' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
                                )}
                            >
                                M
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== DESKTOP TOP BAR ===== */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800 ml-1">Calendar</h2>
                    </div>

                    <button
                        onClick={goToToday}
                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Today
                    </button>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={navigatePrev}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800">
                        {getHeaderTitle()}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setView('week')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                                view === 'week' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                                view === 'month' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== MOBILE LAYOUT: Calendar grid + task list stacked ===== */}
            <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                {/* Compact month grid */}
                <div className="bg-white shrink-0">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 px-2 pt-2">
                        {WEEKDAYS_SHORT.map((day, i) => (
                            <div key={i} className="text-center">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Date cells — compact for mobile month view */}
                    {view === 'month' ? (
                        <div className="grid grid-cols-7 gap-0.5 px-2 py-1">
                            {calendarDays.map((day) => {
                                const dateStr = day.format('YYYY-MM-DD')
                                const dayTasks = tasksByDate[dateStr] || []
                                const isToday = dateStr === todayStr
                                const isSelected = dateStr === selectedDateStr
                                const isCurrentMonth = day.month() === currentMonth.month()

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95",
                                            isSelected && !isToday && "bg-blue-50",
                                            !isSelected && "hover:bg-gray-50"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                                            isToday && "bg-blue-600 text-white font-bold",
                                            !isToday && isSelected && "text-blue-700 font-bold",
                                            !isToday && !isSelected && isCurrentMonth && "text-gray-800",
                                            !isToday && !isSelected && !isCurrentMonth && "text-gray-300"
                                        )}>
                                            {day.date()}
                                        </span>
                                        {/* Task indicator dots */}
                                        {dayTasks.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {dayTasks.slice(0, 3).map((t, i) => {
                                                    const sc = STATUS_COLORS[t.status]
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="w-1 h-1 rounded-full"
                                                            style={{ backgroundColor: sc?.bg || '#4285F4' }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        /* Week view on mobile — horizontal scroll of day cards */
                        <div className="flex gap-1 px-2 py-2 overflow-x-auto">
                            {calendarDays.map((day) => {
                                const dateStr = day.format('YYYY-MM-DD')
                                const dayTasks = tasksByDate[dateStr] || []
                                const isToday = dateStr === todayStr
                                const isSelected = dateStr === selectedDateStr

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "flex-1 min-w-[44px] flex flex-col items-center py-2 rounded-xl transition-all",
                                            isSelected && "bg-blue-600 text-white",
                                            !isSelected && isToday && "bg-blue-50",
                                            !isSelected && !isToday && "hover:bg-gray-50"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[10px] font-semibold uppercase",
                                            isSelected ? "text-blue-100" : "text-gray-400"
                                        )}>
                                            {WEEKDAYS_SHORT[day.day()]}
                                        </span>
                                        <span className={cn(
                                            "text-lg font-bold",
                                            isSelected ? "text-white" : isToday ? "text-blue-600" : "text-gray-800"
                                        )}>
                                            {day.date()}
                                        </span>
                                        {dayTasks.length > 0 && (
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 rounded-full mt-0.5",
                                                isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {dayTasks.length}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Divider with selected date label */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">
                            {selectedDate.format('ddd, MMM D')}
                        </span>
                        {selectedDate.format('YYYY-MM-DD') === todayStr && (
                            <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Today</span>
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        selectedDateTasks.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                    )}>
                        {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                </div>

                {/* Task list for selected date */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                    {selectedDateTasks.map(task => (
                        <TaskDetailCard key={task.id} task={task} />
                    ))}

                    {selectedDateTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                <CalendarIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <h5 className="text-sm font-semibold text-gray-600 mb-1">No tasks</h5>
                            <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                                No tasks scheduled for this day
                            </p>
                        </div>
                    )}
                </div>

                {/* Mobile legend */}
                <div className="px-4 py-2 border-t border-gray-100 bg-white shrink-0">
                    <Legend />
                </div>
            </div>

            {/* ===== DESKTOP LAYOUT: Side-by-side calendar + panel ===== */}
            <div className="hidden md:flex flex-1 overflow-hidden">
                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="px-3 py-2.5 text-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className={cn(
                        "flex-1 grid grid-cols-7 overflow-y-auto",
                        view === 'week' ? "grid-rows-1" : "auto-rows-fr"
                    )}>
                        {calendarDays.map((day) => {
                            const dateStr = day.format('YYYY-MM-DD')
                            const dayTasks = tasksByDate[dateStr] || []
                            const isToday = dateStr === todayStr
                            const isSelected = dateStr === selectedDateStr
                            const isCurrentMonth = day.month() === currentMonth.month()
                            const isWeekend = day.day() === 0 || day.day() === 6

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors group",
                                        view === 'week' ? "min-h-[400px]" : "min-h-[100px]",
                                        isSelected && "bg-blue-50/50",
                                        !isSelected && "hover:bg-gray-50/80",
                                        !isCurrentMonth && view === 'month' && "bg-gray-50/40",
                                        isWeekend && !isSelected && "bg-gray-50/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between px-1 mb-1">
                                        <span className={cn(
                                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                                            isToday && "bg-blue-600 text-white font-bold",
                                            !isToday && isCurrentMonth && "text-gray-800",
                                            !isToday && !isCurrentMonth && "text-gray-300"
                                        )}>
                                            {day.date()}
                                        </span>
                                        {dayTasks.length > 0 && !isToday && (
                                            <span className="text-[10px] font-bold text-gray-400">{dayTasks.length}</span>
                                        )}
                                    </div>

                                    <div className="space-y-0.5 px-0.5">
                                        {dayTasks.slice(0, view === 'week' ? 10 : 3).map(task => {
                                            const sc = STATUS_COLORS[task.status] || STATUS_COLORS['todo']
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={(e) => { e.stopPropagation(); setModalTask(task) }}
                                                    className="flex items-center gap-1 px-1.5 py-[3px] rounded text-[11px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                                                    style={{
                                                        backgroundColor: sc.light,
                                                        color: sc.bg,
                                                        borderLeft: `3px solid ${sc.bg}`,
                                                    }}
                                                    title={task.title}
                                                >
                                                    <span className="truncate">{task.title}</span>
                                                </div>
                                            )
                                        })}
                                        {dayTasks.length > (view === 'week' ? 10 : 3) && (
                                            <span className="text-[10px] font-semibold text-gray-400 px-1.5 block">
                                                +{dayTasks.length - (view === 'week' ? 10 : 3)} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Panel: Selected day details */}
                <div className="w-[320px] shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800 text-base">
                                    {selectedDate.format('dddd')}
                                </h4>
                                <p className="text-2xl font-bold text-blue-600 mt-0.5">
                                    {selectedDate.format('MMM D')}
                                </p>
                            </div>
                            <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-lg",
                                selectedDateTasks.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                            )}>
                                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                        {selectedDateTasks.map(task => (
                            <TaskDetailCard key={task.id} task={task} />
                        ))}

                        {selectedDateTasks.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                    <CalendarIcon className="w-6 h-6 text-gray-300" />
                                </div>
                                <h5 className="text-sm font-semibold text-gray-600 mb-1">No tasks</h5>
                                <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                                    No tasks scheduled for this day
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="px-5 py-3 border-t border-gray-100">
                        <Legend />
                    </div>
                </div>
            </div>

            {/* Task Details Modal */}
            {modalTask && (
                <TaskModal
                    task={modalTask}
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
