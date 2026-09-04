'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ArchiveEmployeeButton({ employeeId, isArchived }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleToggleArchive = async () => {
        const action = isArchived ? 'unarchive' : 'archive'
        const confirmAction = confirm(`Are you sure you want to ${action} this employee?`)
        
        if (!confirmAction) return

        setLoading(true)
        
        const { error } = await supabase
            .from('employees')
            .update({ is_archived: !isArchived })
            .eq('id', employeeId)

        setLoading(false)

        if (error) {
            console.error('Error toggling archive status:', error)
            alert('Failed to update employee status.')
        } else {
            alert(`Employee successfully ${isArchived ? 'unarchived' : 'archived'}.`)
            router.refresh()
            // Optionally, if archived, we could redirect back to the admin list
            if (!isArchived) {
                router.push('/admin')
            }
        }
    }

    return (
        <button
            onClick={handleToggleArchive}
            disabled={loading}
            className={`px-4 py-2 rounded-xl font-semibold shadow-md transition-transform hover:scale-105 active:scale-95 text-white ${
                isArchived 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
        >
            {loading ? 'Processing...' : isArchived ? 'Unarchive Employee' : 'Archive Employee'}
        </button>
    )
}
