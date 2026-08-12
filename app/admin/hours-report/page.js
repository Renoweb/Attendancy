'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar as CalendarIcon } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

dayjs.extend(isoWeek)

export default function HoursReportPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Date filters
  const [startDate, setStartDate] = useState(dayjs().startOf('isoWeek').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().endOf('isoWeek').format('YYYY-MM-DD'))

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.replace('/')

    const { data: emp } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!emp?.is_admin) return router.replace('/')

    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, role')

    const { data: sessions } = await supabase
      .from('work_sessions')
      .select('user_id, duration_minutes')
      .gte('date', startDate)
      .lte('date', endDate)

    const aggregated = employees.map(employee => {
      const empSessions = sessions?.filter(s => s.user_id === employee.id) || []
      const totalMinutes = empSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      const totalHours = Number((totalMinutes / 60).toFixed(2))

      return {
        name: employee.name,
        role: employee.role,
        hours: totalHours,
        isOvertime: totalHours >= 35
      }
    })

    aggregated.sort((a, b) => b.hours - a.hours)
    setData(aggregated)
    setLoading(false)
  }

  const maxHours = Math.max(60, ...data.map(d => d.hours))
  const thresholdPercentage = (35 / maxHours) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-black dark:to-black p-4 sm:p-10">
      <div className="max-w-5xl mx-auto bg-white/60 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-2xl rounded-[2rem] p-6 sm:p-10 border border-white/40 dark:border-white/5">
        
        <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <Link href="/admin" className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  Hours Report
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">
                  Track employee hours across any date range
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/50 dark:bg-[#111] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Filter:</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
              <span className="text-gray-400">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
             <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
             <span className="font-medium animate-pulse">Loading report data...</span>
          </div>
        ) : data.length === 0 || data.every(d => d.hours === 0) ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white/40 dark:bg-black/20 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <span className="font-medium">No work sessions recorded in this date range.</span>
          </div>
        ) : (
          <div className="bg-white/40 dark:bg-[#111111]/80 rounded-[2rem] p-6 sm:p-10 border border-white/50 dark:border-white/5 shadow-sm">
            
            <div className="flex justify-between text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-bold px-1 mb-4 uppercase tracking-wider">
              <span>0h</span>
              <span>{Math.ceil(maxHours)}h Max</span>
            </div>

            <div className="relative pt-6 pb-2">
              
              <div 
                className="absolute top-0 bottom-0 border-l-[2px] border-red-500 border-dashed z-0 opacity-40 pointer-events-none"
                style={{ left: `${thresholdPercentage}%` }}
              >
                <div className="absolute -top-7 -translate-x-1/2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-red-200 dark:border-red-800/50 backdrop-blur-sm">
                  35h Limit
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                {data.map((employee, idx) => {
                  const widthPercentage = Math.min((employee.hours / maxHours) * 100, 100)
                  
                  return (
                    <div key={idx} className="relative group">
                      <div className="flex justify-between items-end mb-3 px-1">
                        <div className="flex items-center gap-2 truncate pr-4">
                          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                            {employee.name}
                          </span>
                          {employee.role && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">
                              • {employee.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {employee.isOvertime && (
                            <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                              OVERTIME
                            </span>
                          )}
                          <span className={`font-black text-sm sm:text-base ${employee.isOvertime ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {employee.hours} <span className="text-xs font-medium text-gray-400">hrs</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full h-4 sm:h-5 bg-gray-200/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-gray-300/20 dark:border-black/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-[1500ms] ease-out relative ${
                            employee.isOvertime 
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.6)]' 
                              : 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                          }`}
                          style={{ width: '0%' }}
                          ref={el => {
                            if (el) {
                              setTimeout(() => {
                                el.style.width = `${widthPercentage}%`
                              }, 100 + (idx * 100))
                            }
                          }}
                        >
                           <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  )
}
