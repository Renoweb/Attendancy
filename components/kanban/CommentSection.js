'use client'

import { useState, useEffect, useRef } from 'react'
import { getTaskComments, addComment, updateComment, deleteComment } from '@/app/actions/kanban'
import { Loader2, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import dayjs from 'dayjs'

export default function CommentSection({ taskId, currentUser }) {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editContent, setEditContent] = useState('')
    const endRef = useRef(null)

    useEffect(() => {
        if (!taskId) return
        
        const loadComments = async () => {
            try {
                const data = await getTaskComments(taskId)
                setComments(data)
            } catch (error) {
                console.error("Failed to load comments", error)
            } finally {
                setLoading(false)
            }
        }
        
        loadComments()
    }, [taskId])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || submitting) return

        setSubmitting(true)
        try {
            const comment = await addComment(taskId, newComment.trim())
            setComments(prev => [...prev, comment])
            setNewComment('')
        } catch (error) {
            console.error("Failed to add comment", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async (commentId) => {
        if (!editContent.trim()) return
        
        try {
            await updateComment(commentId, editContent.trim())
            setComments(prev => prev.map(c => 
                c.id === commentId ? { ...c, content: editContent.trim() } : c
            ))
            setEditingId(null)
        } catch (error) {
            console.error("Failed to update comment", error)
            alert("Failed to update comment. Make sure you have the UPDATE policy in Supabase.")
        }
    }

    const handleDelete = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return
        
        try {
            await deleteComment(commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
        } catch (error) {
            console.error("Failed to delete comment", error)
            alert("Failed to delete comment.")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    comments.map(comment => {
                        const isOwner = comment.user_id === currentUser?.id
                        const isEditing = editingId === comment.id

                        return (
                            <div key={comment.id} className="flex gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                                    {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-xs text-gray-800">{comment.author?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400">
                                                {dayjs(comment.created_at).format('MMM D, h:mm A')}
                                            </span>
                                            {isOwner && !isEditing && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingId(comment.id)
                                                            setEditContent(comment.content)
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit comment"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(comment.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="mt-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(comment.id)}
                                                    disabled={!editContent.trim()}
                                                    className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-2 rounded-xl transition-colors flex items-center justify-center shrink-0"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </form>
        </div>
    )
}
