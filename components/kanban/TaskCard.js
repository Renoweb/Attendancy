'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare, CheckCircle2 } from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

export default function TaskCard({ task, isOverlay, currentUser, onClick, columnColor }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }

    // Placeholder ghost while dragging
    if (isDragging && !isOverlay) {
        return (
            <div
                ref={setNodeRef}
                className="h-[100px] rounded-xl border-2 border-dashed opacity-40 transition-all"
                style={{ ...style, borderColor: columnColor || '#4285F4', backgroundColor: `${columnColor || '#4285F4'}08` }}
            />
        )
    }

    const isOverdue = task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day') && task.status !== 'done'
    const isDueSoon = task.due_date && dayjs(task.due_date).diff(dayjs(), 'day') <= 2 && dayjs(task.due_date).isAfter(dayjs()) && task.status !== 'done'
    const isCreator = task.creator_id === currentUser?.id
    const isAssignee = task.assignee_id === currentUser?.id

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                "group relative bg-white p-4 rounded-xl border border-gray-100 cursor-grab active:cursor-grabbing transition-all duration-200",
                "hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5",
                isOverlay && "rotate-[2deg] scale-105 shadow-2xl cursor-grabbing ring-2 ring-blue-400/30"
            )}
        >
            {/* Label chips */}
            {task.labels?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2.5">
                    {task.labels.map((label) => (
                        <span
                            key={label.id}
                            className="text-[11px] font-bold px-2 py-[3px] rounded-md leading-none"
                            style={{ 
                                backgroundColor: `${label.color}15`, 
                                color: label.color,
                                border: `1px solid ${label.color}25`
                            }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Title */}
            <h4 className="font-semibold text-gray-800 text-[15px] leading-snug mb-2">
                {task.title}
            </h4>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                    {task.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2.5">
                    {task.due_date && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md",
                            isOverdue && "bg-red-50 text-red-600",
                            isDueSoon && "bg-yellow-50 text-yellow-700",
                            !isOverdue && !isDueSoon && "text-gray-400"
                        )}>
                            <Calendar className="w-3 h-3" />
                            <span>{dayjs(task.due_date).format('MMM D')}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Creator/assignee badges */}
                    {isCreator && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            Owner
                        </span>
                    )}
                    {isAssignee && !isCreator && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            Assigned
                        </span>
                    )}

                    {/* Assignee avatar */}
                    {task.assignee ? (
                        <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
                            style={{ backgroundColor: columnColor || '#4285F4' }}
                            title={`Assigned to ${task.assignee.name}`}
                        >
                            {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300">
                            ?
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
