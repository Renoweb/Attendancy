'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Tag, Trash2, Save, Loader2, MessageSquare, ChevronDown, Check, Layers } from 'lucide-react'
import { createTask, updateTaskDetails, deleteTask } from '@/app/actions/kanban'
import CommentSection from './CommentSection'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import CalendarComponent from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function TaskModal({ task, onClose, labels, employees, currentUser, setTasks }) {
    const isNew = !task?.id
    const isCreator = isNew || task?.creator_id === currentUser?.id
    
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [status, setStatus] = useState(task?.status || 'todo')
    const [dueDate, setDueDate] = useState(task?.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : '')
    const [assigneeId, setAssigneeId] = useState(task?.assignee_id || '')
    const [selectedLabels, setSelectedLabels] = useState(task?.labels?.map(l => l.id) || [])
    
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [mobileTab, setMobileTab] = useState('details') // 'details', 'meta', 'comments'

    // Prevent accidental close when interacting inside
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !saving) {
            onClose()
        }
    }

    const toggleLabel = (labelId) => {
        if (!isCreator) return
        setSelectedLabels(prev => 
            prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
        )
    }

    const handleSave = async () => {
        if (!title.trim() || !isCreator) return
        setSaving(true)

        try {
            const data = {
                title,
                description,
                status,
                due_date: dueDate ? dayjs(dueDate).toISOString() : null,
                assignee_id: assigneeId || null,
                labels: selectedLabels
            }

            if (isNew) {
                const newTask = await createTask({ ...data, status: status || 'todo' })
                const formattedNewTask = {
                    ...newTask,
                    assignee: employees.find(e => e.id === newTask.assignee_id),
                    creator: employees.find(e => e.id === currentUser.id),
                    labels: labels.filter(l => selectedLabels.includes(l.id))
                }
                setTasks(prev => [...prev, formattedNewTask])
            } else {
                await updateTaskDetails(task.id, data)
                setTasks(prev => prev.map(t => t.id === task.id ? {
                    ...t,
                    title,
                    description,
                    status,
                    due_date: data.due_date,
                    assignee_id: data.assignee_id,
                    assignee: employees.find(e => e.id === data.assignee_id),
                    labels: labels.filter(l => selectedLabels.includes(l.id))
                } : t))
            }
            onClose()
        } catch (error) {
            console.error("Save failed:", error)
            alert("Failed to save task: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!isCreator) return
        setDeleting(true)
        try {
            await deleteTask(task.id)
            setTasks(prev => prev.filter(t => t.id !== task.id))
            onClose()
        } catch (error) {
            console.error("Delete failed:", error)
            alert("Failed to delete task.")
        } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const STATUS_OPTIONS = [
        { id: 'todo', label: 'Todo', emoji: '📋', color: '#4285F4' },
        { id: 'in_progress', label: 'In Progress', emoji: '⚡', color: '#FBBC05' },
        { id: 'done', label: 'Done', emoji: '✅', color: '#34A853' },
        { id: 'future_planned', label: 'Future Planned', emoji: '🔮', color: '#EA4335' },
    ]

    const currentStatus = STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[0]

    // Shared metadata panel content
    const MetadataContent = () => (
        <>
            {/* Status */}
            <div className="relative">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <Layers className="w-4 h-4" /> Status
                </label>
                
                <button
                    type="button"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm hover:border-gray-300"
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: currentStatus.color }}
                        />
                        <span className="text-gray-900 font-medium">{currentStatus.label}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showStatusDropdown && "rotate-180")} />
                </button>

                {showStatusDropdown && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowStatusDropdown(false)}
                        />
                        <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-1">
                                {STATUS_OPTIONS.map(opt => {
                                    const isSelected = opt.id === status
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                setStatus(opt.id)
                                                setShowStatusDropdown(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors",
                                                isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-base">{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Assignee */}
            <div className="relative">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <User className="w-4 h-4" /> Assignee
                </label>
                
                <button
                    type="button"
                    onClick={() => isCreator && setShowAssigneeDropdown(!showAssigneeDropdown)}
                    disabled={!isCreator}
                    className={cn(
                        "w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm hover:border-gray-300",
                        !isCreator && "bg-gray-100 opacity-70 cursor-not-allowed hover:border-gray-200 shadow-none"
                    )}
                >
                    <span className={assigneeId ? "text-gray-900 font-medium" : "text-gray-500"}>
                        {assigneeId ? employees.find(e => e.id === assigneeId)?.name : "Unassigned"}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showAssigneeDropdown && "rotate-180")} />
                </button>

                {showAssigneeDropdown && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowAssigneeDropdown(false)}
                        />
                        <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[200px] overflow-y-auto">
                            <div className="p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAssigneeId('')
                                        setShowAssigneeDropdown(false)
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors",
                                        !assigneeId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    Unassigned
                                    {!assigneeId && <Check className="w-4 h-4 text-blue-600" />}
                                </button>
                                
                                {employees.map(emp => {
                                    const isSelected = emp.id === assigneeId
                                    return (
                                        <button
                                            key={emp.id}
                                            type="button"
                                            onClick={() => {
                                                setAssigneeId(emp.id)
                                                setShowAssigneeDropdown(false)
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors",
                                                isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                                            )}
                                        >
                                            {emp.name}
                                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Due Date */}
            <div className="relative">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <Calendar className="w-4 h-4" /> Due Date
                </label>
                <button
                    type="button"
                    onClick={() => isCreator && setShowCalendar(!showCalendar)}
                    disabled={!isCreator}
                    className={cn(
                        "w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all",
                        !isCreator && "bg-gray-100 opacity-70 cursor-not-allowed"
                    )}
                >
                    <span className={dueDate ? "text-gray-900" : "text-gray-400"}>
                        {dueDate ? dayjs(dueDate).format('DD MMM YYYY') : "Select date"}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                </button>
                
                {showCalendar && (
                    <div className="absolute z-10 top-full mt-2 left-0 md:right-0 md:left-auto bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 w-full md:w-[300px]">
                        <CalendarComponent 
                            onChange={(val) => {
                                setDueDate(dayjs(val).format('YYYY-MM-DD'))
                                setShowCalendar(false)
                            }} 
                            value={dueDate ? new Date(dueDate) : null}
                            className="border-0 font-sans !w-full"
                        />
                    </div>
                )}
            </div>

            {/* Labels */}
            <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    <Tag className="w-4 h-4" /> Labels
                </label>
                <div className="flex flex-wrap gap-2">
                    {labels.map(label => {
                        const isSelected = selectedLabels.includes(label.id)
                        return (
                            <button
                                key={label.id}
                                onClick={() => toggleLabel(label.id)}
                                disabled={!isCreator}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                    isSelected ? "shadow-sm" : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0",
                                    !isCreator && "cursor-default hover:opacity-50"
                                )}
                                style={{
                                    backgroundColor: isSelected ? `${label.color}20` : 'transparent',
                                    borderColor: isSelected ? label.color : '#e5e7eb',
                                    color: isSelected ? label.color : '#6b7280'
                                }}
                            >
                                {label.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Creator Info */}
            {!isNew && task.creator && (
                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Created by <span className="font-semibold text-gray-700">{task.creator.name}</span>
                </div>
            )}
        </>
    )

    // Shared actions content
    const ActionsContent = () => (
        <>
            {isCreator && (
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>

                    {!isNew && (
                        <>
                            {showDeleteConfirm ? (
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col gap-2">
                                    <p className="text-xs text-red-600 font-medium text-center">Are you sure?</p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center"
                                        >
                                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full bg-white hover:bg-red-50 text-red-600 font-semibold py-3 rounded-xl shadow-sm border border-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Task
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    )

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center md:p-6"
            onClick={handleBackdropClick}
        >
            {/* Modal container — slides up on mobile, centered on desktop */}
            <div className={cn(
                "bg-white w-full flex flex-col overflow-hidden shadow-2xl animate-in duration-300",
                // Mobile: bottom sheet with rounded top, use dvh for real viewport
                "rounded-t-3xl max-h-[85dvh]",
                // Desktop: centered modal
                "md:rounded-3xl md:max-w-4xl md:max-h-[90vh]"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 md:px-6 py-3.5 md:py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    {/* Mobile drag handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full md:hidden" />
                    
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        {isNew ? 'Create Task' : 'Task Details'}
                    </h2>
                    <button 
                        onClick={onClose}
                        disabled={saving}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mobile Tab Bar */}
                <div className="md:hidden flex border-b border-gray-100 bg-white shrink-0">
                    {[
                        { id: 'details', label: 'Details', icon: '📝' },
                        { id: 'meta', label: 'Settings', icon: '⚙️' },
                        ...(!isNew ? [{ id: 'comments', label: 'Chat', icon: '💬' }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMobileTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all",
                                mobileTab === tab.id
                                    ? "text-blue-600 border-blue-600"
                                    : "text-gray-400 border-transparent hover:text-gray-600"
                            )}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ===== DESKTOP LAYOUT ===== */}
                <div className="hidden md:flex flex-1 overflow-y-auto flex-row">
                    {/* Left Col: Main Details */}
                    <div className="flex-1 p-6 space-y-6">
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                readOnly={!isCreator}
                                placeholder="Task Title"
                                className={cn(
                                    "w-full text-2xl font-bold text-gray-800 bg-transparent border-0 border-b-2 border-transparent focus:ring-0 focus:border-blue-500 px-0 transition-colors placeholder:text-gray-300",
                                    !isCreator && "focus:border-transparent cursor-default"
                                )}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                readOnly={!isCreator}
                                placeholder="Add a more detailed description..."
                                className={cn(
                                    "w-full min-h-[120px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y p-3 text-sm transition-all",
                                    !isCreator && "bg-white border-transparent resize-none cursor-default focus:ring-0"
                                )}
                            />
                        </div>

                        {!isNew && (
                            <div className="pt-4">
                                <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                    <h3>Discussion</h3>
                                </div>
                                <div className="h-[250px]">
                                    <CommentSection taskId={task.id} currentUser={currentUser} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Metadata & Actions */}
                    <div className="w-80 bg-gray-50 border-l border-gray-100 p-6 flex flex-col gap-6">
                        <MetadataContent />
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            <ActionsContent />
                        </div>
                    </div>
                </div>

                {/* Mobile scrollable content area */}
                <div className="md:hidden flex-1 overflow-y-auto min-h-0">
                    {/* Details Tab */}
                    {mobileTab === 'details' && (
                        <div className="p-4 space-y-5">
                            <div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    readOnly={!isCreator}
                                    placeholder="Task Title"
                                    className={cn(
                                        "w-full text-xl font-bold text-gray-800 bg-transparent border-0 border-b-2 border-transparent focus:ring-0 focus:border-blue-500 px-0 transition-colors placeholder:text-gray-300",
                                        !isCreator && "focus:border-transparent cursor-default"
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    readOnly={!isCreator}
                                    placeholder="Add a more detailed description..."
                                    className={cn(
                                        "w-full min-h-[100px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y p-3 text-sm transition-all",
                                        !isCreator && "bg-white border-transparent resize-none cursor-default focus:ring-0"
                                    )}
                                />
                            </div>

                            {/* Quick meta summary on details tab */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <div 
                                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                                    style={{ backgroundColor: `${currentStatus.color}15`, color: currentStatus.color }}
                                >
                                    <span className="text-sm">{currentStatus.emoji}</span>
                                    {currentStatus.label}
                                </div>
                                {assigneeId && (
                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                                        <User className="w-3 h-3" />
                                        {employees.find(e => e.id === assigneeId)?.name}
                                    </div>
                                )}
                                {dueDate && (
                                    <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                                        <Calendar className="w-3 h-3" />
                                        {dayjs(dueDate).format('MMM D, YYYY')}
                                    </div>
                                )}
                                {selectedLabels.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                                        <Tag className="w-3 h-3" />
                                        {selectedLabels.length} label{selectedLabels.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Settings/Meta Tab */}
                    {mobileTab === 'meta' && (
                        <div className="p-4 space-y-5">
                            <MetadataContent />
                        </div>
                    )}

                    {/* Comments Tab */}
                    {mobileTab === 'comments' && !isNew && (
                        <div className="p-4 flex flex-col" style={{ height: '50dvh' }}>
                            <CommentSection taskId={task.id} currentUser={currentUser} />
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Action Bar */}
                {isCreator && (
                    <div className="md:hidden shrink-0 border-t border-gray-100 bg-white px-4 py-3 safe-bottom">
                        <ActionsContent />
                    </div>
                )}
            </div>
        </div>
    )
}
