'use client'

import { useState, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { updateTaskPosition } from '@/app/actions/kanban'
import TaskModal from './TaskModal'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS = ['todo', 'in_progress', 'done', 'future_planned']

export default function KanbanBoard({ tasks, setTasks, labels, employees, currentUser }) {
    const [activeTask, setActiveTask] = useState(null)
    const [modalTask, setModalTask] = useState(null) // null = closed, {} = new, {...} = edit

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag needed to activate (helps with clicking elements inside cards)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Memoize tasks per column for performance
    const columnsData = useMemo(() => {
        const cols = {
            'todo': [],
            'in_progress': [],
            'done': [],
            'future_planned': []
        }
        tasks.forEach(t => {
            if (cols[t.status]) {
                cols[t.status].push(t)
            }
        })
        return cols
    }, [tasks])

    const handleDragStart = (event) => {
        const { active } = event
        const task = tasks.find((t) => t.id === active.id)
        if (task) setActiveTask(task)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const activeId = active.id
        const overId = over.id

        const activeTask = tasks.find((t) => t.id === activeId)
        if (!activeTask) return

        // Cannot move if not creator or assignee
        const isCreator = activeTask.creator_id === currentUser?.id
        const isAssignee = activeTask.assignee_id === currentUser?.id
        if (!isCreator && !isAssignee) {
            // Revert state visually by doing nothing if they bypassed UI somehow
            // But UI should prevent drag start anyway
            return
        }

        const isOverColumn = COLUMNS.includes(overId)

        let newStatus = activeTask.status
        let newPosition = activeTask.position_order

        // Determine new status and position
        if (isOverColumn) {
            newStatus = overId
            // Dropped on empty column
            const colTasks = columnsData[newStatus]
            newPosition = colTasks.length > 0 ? colTasks[colTasks.length - 1].position_order + 100 : 100
        } else {
            const overTask = tasks.find((t) => t.id === overId)
            if (overTask) {
                newStatus = overTask.status
                const colTasks = columnsData[newStatus]
                const overIndex = colTasks.findIndex((t) => t.id === overId)
                const activeIndex = colTasks.findIndex((t) => t.id === activeId)

                if (newStatus === activeTask.status) {
                    // Reordering within same column
                    if (overIndex === 0) {
                        newPosition = colTasks[0].position_order - 100
                    } else if (overIndex === colTasks.length - 1) {
                        newPosition = colTasks[colTasks.length - 1].position_order + 100
                    } else {
                        // Calculate middle position
                        const prevPos = colTasks[overIndex < activeIndex ? overIndex - 1 : overIndex].position_order
                        const nextPos = colTasks[overIndex < activeIndex ? overIndex : overIndex + 1].position_order
                        newPosition = (prevPos + nextPos) / 2
                    }
                } else {
                    // Moving to different column
                    if (overIndex === 0) {
                        newPosition = colTasks[0].position_order - 100
                    } else {
                        const prevPos = colTasks[overIndex - 1].position_order
                        const currPos = colTasks[overIndex].position_order
                        newPosition = (prevPos + currPos) / 2
                    }
                }
            }
        }

        // Optimistic UI update
        const updatedTasks = tasks.map(t =>
            t.id === activeId ? { ...t, status: newStatus, position_order: newPosition } : t
        ).sort((a, b) => a.position_order - b.position_order)

        setTasks(updatedTasks)

        try {
            await updateTaskPosition(activeId, newStatus, newPosition)
        } catch (error) {
            console.error("Failed to update position:", error)
            // Revert on failure by refetching or relying on a stable initial state (omitted for brevity, a full implementation would save previous state)
            alert("Failed to save movement. Please refresh.")
        }
    }

    return (
        <div className="h-full w-full p-6 overflow-x-auto overflow-y-hidden">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Board</h2>
                <button
                    onClick={() => setModalTask({})}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-5 h-[calc(100%-80px)] min-w-max">
                    {COLUMNS.map((columnId) => (
                        <KanbanColumn
                            key={columnId}
                            columnId={columnId}
                            tasks={columnsData[columnId]}
                            currentUser={currentUser}
                            onTaskClick={setModalTask}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <TaskCard task={activeTask} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

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
