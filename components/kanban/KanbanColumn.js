'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

const COLUMN_CONFIG = {
    'todo': {
        label: 'Todo',
        color: '#4285F4',
        gradient: 'from-blue-500/8 to-blue-500/3',
        borderColor: 'border-blue-200/60',
        dotColor: 'bg-blue-500',
        emoji: '📋',
    },
    'in_progress': {
        label: 'In Progress',
        color: '#FBBC05',
        gradient: 'from-yellow-500/8 to-yellow-500/3',
        borderColor: 'border-yellow-200/60',
        dotColor: 'bg-yellow-500',
        emoji: '⚡',
    },
    'done': {
        label: 'Done',
        color: '#34A853',
        gradient: 'from-green-500/8 to-green-500/3',
        borderColor: 'border-green-200/60',
        dotColor: 'bg-green-500',
        emoji: '✅',
    },
    'future_planned': {
        label: 'Future Planned',
        color: '#EA4335',
        gradient: 'from-red-500/8 to-red-500/3',
        borderColor: 'border-red-200/60',
        dotColor: 'bg-red-400',
        emoji: '🔮',
    },
}

export default function KanbanColumn({ columnId, tasks, currentUser, onTaskClick, isMobile }) {
    const { setNodeRef, isOver } = useDroppable({
        id: columnId,
    })

    const taskIds = tasks.map((t) => t.id)
    const config = COLUMN_CONFIG[columnId] || COLUMN_CONFIG['todo']

    return (
        <div className={cn(
            "flex flex-col shrink-0 rounded-2xl border transition-all duration-300 relative overflow-hidden pt-1.5",
            config.borderColor,
            `bg-gradient-to-b ${config.gradient}`,
            isOver && "ring-2 ring-offset-2 scale-[1.01]",
            // Mobile: full width, full height
            isMobile ? "w-full h-full" : "w-[340px]"
        )}
            style={isOver ? { ringColor: config.color } : {}}
        >
            {/* Top colored accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: config.color }} />

            {/* Column Header — hidden on mobile since we have tabs */}
            <div className={cn("flex items-center justify-between px-4 py-3", isMobile && "hidden")}>
                <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{config.emoji}</span>
                    <h3 className="font-bold text-gray-800 text-base tracking-wide">{config.label}</h3>
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: config.color }}
                    >
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Droppable area */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 px-3 pb-3 overflow-y-auto transition-all duration-200",
                    isOver && "bg-white/40",
                    isMobile && "pt-3"
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <div className={cn(
                        "flex flex-col gap-2.5",
                        isMobile ? "min-h-[80px]" : "min-h-[120px]"
                    )}>
                        {tasks.map((task) => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                currentUser={currentUser}
                                onClick={() => onTaskClick(task)}
                                columnColor={config.color}
                            />
                        ))}
                        {tasks.length === 0 && (
                            <div className={cn(
                                "flex flex-col items-center justify-center gap-3 text-gray-300",
                                isMobile ? "py-16" : "py-10"
                            )}>
                                <Inbox className="w-11 h-11 opacity-40" />
                                <p className="text-sm font-medium text-gray-400">No tasks yet</p>
                                <p className="text-xs text-gray-300">Drop tasks here</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}
