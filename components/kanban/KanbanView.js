'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import KanbanSidebar from './KanbanSidebar'
import KanbanBoard from './KanbanBoard'
import KanbanCalendar from './KanbanCalendar'
import TaskListView from './TaskListView'
import { Menu } from 'lucide-react'

export default function KanbanView() {
    const [tasks, setTasks] = useState([])
    const [labels, setLabels] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)
    const [filter, setFilter] = useState('all') // 'all', 'mine', 'calendar'
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setCurrentUser(user)

                // Fetch all data in parallel — avoid nested join that causes errors
                const [tasksRes, taskLabelsRes, labelsRes, employeesRes] = await Promise.all([
                    supabase
                        .from('tasks')
                        .select('*')
                        .order('position_order', { ascending: true }),
                    supabase
                        .from('task_label_links')
                        .select('task_id, label_id'),
                    supabase.from('task_labels').select('*'),
                    supabase.from('employees').select('id, name, email')
                ])

                if (tasksRes.error) throw tasksRes.error
                if (taskLabelsRes.error) throw taskLabelsRes.error
                if (labelsRes.error) throw labelsRes.error
                if (employeesRes.error) throw employeesRes.error

                // Build a label lookup map
                const labelMap = {}
                labelsRes.data.forEach(l => { labelMap[l.id] = l })

                // Build an employee lookup map
                const employeeMap = {}
                employeesRes.data.forEach(e => { employeeMap[e.id] = e })

                // Build a taskId → labels map
                const taskLabelMap = {}
                taskLabelsRes.data.forEach(tl => {
                    if (!taskLabelMap[tl.task_id]) taskLabelMap[tl.task_id] = []
                    if (labelMap[tl.label_id]) {
                        taskLabelMap[tl.task_id].push(labelMap[tl.label_id])
                    }
                })

                // Merge labels and employees into tasks
                const formattedTasks = tasksRes.data.map(task => ({
                    ...task,
                    assignee: employeeMap[task.assignee_id] || null,
                    creator: employeeMap[task.creator_id] || null,
                    labels: taskLabelMap[task.id] || []
                }))

                setTasks(formattedTasks)
                setLabels(labelsRes.data)
                setEmployees(employeesRes.data)
            } catch (error) {
                console.error("Error fetching kanban data details:", {
                    message: error?.message,
                    code: error?.code,
                    details: error?.details,
                    hint: error?.hint,
                    raw: error
                })
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [])

    const myTasks = currentUser
        ? tasks.filter(t => t.assignee_id === currentUser.id || t.creator_id === currentUser.id)
        : []

    // Get current view label for mobile header
    const viewLabels = { all: 'All Tasks', mine: 'Your Tasks', calendar: 'Calendar' }
    const viewEmojis = { all: '📋', mine: '👤', calendar: '📅' }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
                </div>
                <p className="text-sm text-gray-400 font-medium animate-pulse">Loading board...</p>
            </div>
        )
    }

    const renderContent = () => {
        if (filter === 'calendar') {
            return (
                <KanbanCalendar
                    tasks={tasks}
                    setTasks={setTasks}
                    labels={labels}
                    employees={employees}
                    currentUser={currentUser}
                />
            )
        }

        if (filter === 'mine') {
            return (
                <TaskListView
                    tasks={myTasks}
                    setTasks={setTasks}
                    labels={labels}
                    employees={employees}
                    currentUser={currentUser}
                />
            )
        }

        return (
            <KanbanBoard
                tasks={tasks}
                setTasks={setTasks}
                labels={labels}
                employees={employees}
                currentUser={currentUser}
            />
        )
    }

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] min-h-[400px] md:min-h-[700px] w-full md:rounded-2xl overflow-hidden md:border md:border-gray-200/60 md:shadow-lg bg-white relative" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {/* Mobile top bar with hamburger */}
            <div className="absolute top-0 left-0 right-0 h-12 md:h-14 bg-white border-b border-gray-100 flex items-center px-3 md:px-4 gap-2 md:gap-3 z-30 md:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors active:scale-95"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5">
                    <span className="text-base">{viewEmojis[filter]}</span>
                    <span className="text-sm font-semibold text-gray-800">{viewLabels[filter]}</span>
                </div>
            </div>

            <KanbanSidebar
                filter={filter}
                setFilter={setFilter}
                currentUser={currentUser}
                taskCount={tasks.length}
                myTaskCount={myTasks.length}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50/50 to-blue-50/30 pt-12 md:pt-0">
                {renderContent()}
            </div>
        </div>
    )
}
