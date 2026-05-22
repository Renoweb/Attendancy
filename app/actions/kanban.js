'use client'

import { supabase } from '@/lib/supabaseClient'

export async function createTask(data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { title, description, status, due_date, assignee_id, labels } = data

    // Insert task
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
            title,
            description,
            status: status || 'todo',
            due_date,
            assignee_id: assignee_id || null,
            creator_id: user.id,
            position_order: Date.now() // Simple initial position logic
        })
        .select('*')
        .single()

    if (taskError) throw new Error(taskError.message)

    // Insert labels
    if (labels && labels.length > 0) {
        const labelInserts = labels.map(labelId => ({
            task_id: task.id,
            label_id: labelId
        }))
        const { error: labelError } = await supabase
            .from('task_label_links')
            .insert(labelInserts)
        
        if (labelError) console.error("Error inserting labels:", labelError)
    }

    return task
}

export async function updateTaskPosition(taskId, newStatus, newPosition) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('creator_id, assignee_id')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) throw new Error("Task not found")

    // Both creator and assignee can move the task
    if (task.creator_id !== user.id && task.assignee_id !== user.id) {
        throw new Error("Unauthorized to move this task")
    }

    const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus, position_order: newPosition, updated_at: new Date().toISOString() })
        .eq('id', taskId)

    if (updateError) throw new Error(updateError.message)
    return true
}

export async function updateTaskDetails(taskId, data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('creator_id')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) throw new Error("Task not found")

    // ONLY creator can edit details
    if (task.creator_id !== user.id) {
        throw new Error("Only the creator can edit task details")
    }

    const { title, description, due_date, assignee_id, status, labels } = data

    const { error: updateError } = await supabase
        .from('tasks')
        .update({
            title,
            description,
            due_date,
            assignee_id: assignee_id || null,
            ...(status && { status }),
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

    if (updateError) throw new Error(updateError.message)

    // Update labels (delete old, insert new)
    if (labels !== undefined) {
        await supabase.from('task_label_links').delete().eq('task_id', taskId)
        if (labels.length > 0) {
            const labelInserts = labels.map(labelId => ({
                task_id: taskId,
                label_id: labelId
            }))
            await supabase.from('task_label_links').insert(labelInserts)
        }
    }

    return true
}

export async function deleteTask(taskId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('creator_id')
        .eq('id', taskId)
        .single()

    if (fetchError || !task) throw new Error("Task not found")

    // ONLY creator can delete
    if (task.creator_id !== user.id) {
        throw new Error("Only the creator can delete this task")
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) throw new Error(error.message)
    return true
}

export async function addComment(taskId, content) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
            task_id: taskId,
            user_id: user.id,
            content
        })
        .select('*')
        .single()

    if (error) throw new Error(error.message)

    // Fetch author name separately
    const { data: author } = await supabase
        .from('employees')
        .select('name')
        .eq('id', user.id)
        .single()

    return { ...comment, author: author || { name: 'Unknown' } }
}

export async function getTaskComments(taskId) {
    const { data: comments, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    // Fetch all unique user IDs
    const authorIds = [...new Set(comments.map(c => c.user_id))]
    const { data: authors } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', authorIds)

    const authorMap = {}
    authors?.forEach(a => { authorMap[a.id] = a })

    return comments.map(c => ({
        ...c,
        author: authorMap[c.user_id] || { name: 'Unknown' }
    }))
}

export async function updateComment(commentId, content) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('task_comments')
        .update({ content })
        .eq('id', commentId)
        // Ensure user owns comment - supabase policies will also enforce this
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    return true
}

export async function deleteComment(commentId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)
        // Ensure user owns comment - supabase policies will also enforce this
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    return true
}
