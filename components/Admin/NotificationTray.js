'use client'
import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default function NotificationTray() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (!error && data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const markAsRead = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id)
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.map(n => n.id)
    setNotifications([])
    
    if (unreadIds.length > 0) {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a] animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                        {dayjs(notification.created_at).fromNow()}
                      </span>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 h-fit rounded-full text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
