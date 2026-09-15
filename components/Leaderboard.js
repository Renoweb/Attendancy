'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch('/api/leaderboard', {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setLeaders(result.data || [])
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-white/40 dark:bg-[#111111]/80 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/5 shadow-sm">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500 font-medium animate-pulse text-sm">Loading Top Performers...</span>
        </div>
      </div>
    )
  }

  if (leaders.length === 0) {
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  }

  // Medals and colors for top 3
  const ranks = [
    { 
        icon: <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400 drop-shadow-md" />, 
        bgClass: 'bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:via-yellow-800/30 dark:to-yellow-900/10 border-yellow-300 dark:border-yellow-700/50',
        badge: 'text-yellow-700 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-900/60',
        ringClass: 'ring-yellow-400/50'
    },
    { 
        icon: <Medal className="w-6 h-6 text-gray-400 dark:text-gray-300 drop-shadow-md" />, 
        bgClass: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-50 dark:from-gray-800/60 dark:via-gray-800/40 dark:to-gray-900/20 border-gray-300 dark:border-gray-600/50',
        badge: 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800',
        ringClass: 'ring-gray-400/50'
    },
    { 
        icon: <Award className="w-6 h-6 text-amber-700 dark:text-amber-600 drop-shadow-md" />, 
        bgClass: 'bg-gradient-to-r from-orange-200 via-orange-100 to-orange-50 dark:from-orange-900/40 dark:via-orange-800/30 dark:to-orange-900/10 border-orange-300 dark:border-orange-800/50',
        badge: 'text-orange-800 dark:text-orange-400 bg-orange-200 dark:bg-orange-900/60',
        ringClass: 'ring-orange-500/50'
    }
  ]

  return (
    <div className="w-full bg-white/60 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-xl rounded-[2rem] p-6 sm:p-8 border border-white/40 dark:border-white/5 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 dark:opacity-[0.03] pointer-events-none">
        <Star className="w-64 h-64 text-yellow-500" fill="currentColor" />
      </div>

      <div 
        className="flex items-center justify-between gap-3 relative z-10 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-2xl shadow-inner border border-yellow-200/50 dark:border-yellow-700/30 group-hover:scale-105 transition-transform">
              <Trophy className="w-7 h-7 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-500">
                Past Week's Top Performers
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Celebrating our hardest workers from last week
              </p>
            </div>
        </div>
        <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 32 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10"
            >
        <AnimatePresence>
          {leaders.map((leader, index) => {
            const rankStyle = ranks[index] || ranks[2] // Fallback if more than 3 somehow
            return (
              <motion.div
                key={leader.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col items-center text-center justify-center p-6 rounded-[2rem] border ${rankStyle.bgClass} shadow-sm hover:shadow-lg transition-all duration-300 group`}
              >
                  {/* Rank Avatar/Icon */}
                  <div className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-black shadow-inner border border-gray-100 dark:border-gray-800 ring-4 mb-4 ${rankStyle.ringClass}`}>
                     {rankStyle.icon}
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-900 shadow-sm z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        #{index + 1}
                     </div>
                  </div>

                  <div className="flex flex-col mb-5">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-xl group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors">
                      {leader.name}
                    </span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                      {leader.role || 'Team Member'}
                    </span>
                  </div>

                  <div className={`mt-auto px-4 py-2 rounded-full flex items-center justify-center gap-2 shadow-inner backdrop-blur-sm w-full ${rankStyle.badge}`}>
                      <Clock className="w-4 h-4" />
                      <span className="font-black text-base">
                        {leader.hours} <span className="text-xs opacity-80 font-semibold">hrs</span>
                      </span>
                  </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
