'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import dayjs from 'dayjs'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#a855f7', '#d946ef', '#fb923c']

export default function RateReportPage() {
  const [data, setData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [hiddenLines, setHiddenLines] = useState({})
  const router = useRouter()

  // Date filters
  const [startDate, setStartDate] = useState(dayjs().subtract(13, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))

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

    const { data: emps } = await supabase.from('employees').select('id, name').eq('is_archived', false)
    
    // ========================================================================
    // MATH & AGGREGATION LOGIC: BUILDING THE TIMELINE
    // ========================================================================
    // To display a LineChart, Recharts expects an array of objects where each 
    // object represents a point on the X-axis (in this case, a Date).
    // Each object must contain the X-axis label, and keys for every line's value.
    // Example format needed: [{ date: 'Aug 10', Sam: 6, Indrajit: 8 }, ...]
    // ========================================================================

    // 1. Calculate the number of days between the selected start and end dates.
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const days = Math.max(1, end.diff(start, 'day') + 1)
    
    let timeSeries = []
    for (let i = 0; i < days; i++) {
      const d = start.add(i, 'day')
      timeSeries.push({
        date: d.format('MMM D'),           // Display name for the X-axis tick
        fullDate: d.format('YYYY-MM-DD')   // Used internally to match with Supabase data
      })
    }

    // 3. Fetch ALL work sessions for ALL employees within this exact date range.
    // Doing one large fetch is much faster than fetching individually per employee.
    const { data: sessions } = await supabase
      .from('work_sessions')
      .select('user_id, date, duration_minutes')
      .gte('date', start.format('YYYY-MM-DD'))
      .lte('date', end.format('YYYY-MM-DD'))

    // 4. Map the fetched sessions onto our `timeSeries` array.
    emps.forEach(employee => {
      // Isolate sessions belonging only to the current employee in the loop
      const empSessions = sessions?.filter(s => s.user_id === employee.id) || []
      
      // We first group this employee's sessions by date, summing up the total minutes.
      // E.g. { '2026-08-10': 360, '2026-08-11': 420 }
      const hoursByDate = {}
      empSessions.forEach(s => {
        if (!hoursByDate[s.date]) hoursByDate[s.date] = 0
        hoursByDate[s.date] += (s.duration_minutes || 0)
      })

      // Finally, iterate through our base timeline array.
      // If the employee has logged minutes on that specific `fullDate`, convert to hours.
      // If not, default to 0. This creates the continuous line dropping to 0 on days off.
      timeSeries.forEach(point => {
        const mins = hoursByDate[point.fullDate] || 0
        // Create a new key on the point object using the employee's exact name.
        // Recharts will look for this key when drawing their specific <Line />
        point[employee.name] = Number((mins / 60).toFixed(2))
      })
    })

    // At this point, timeSeries is fully populated and ready for Recharts!

    setEmployees(emps)
    setData(timeSeries)
    setLoading(false)
  }

  const toggleLine = (name) => {
    setHiddenLines(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter out 0 hours for cleaner tooltip
      const activePayload = payload.filter(p => p.value > 0)
      const sortedPayload = [...activePayload].sort((a, b) => b.value - a.value)

      if (sortedPayload.length === 0) return null

      return (
        <div className="bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl min-w-[220px]">
          <p className="font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            {sortedPayload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 pr-4 truncate">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium text-gray-600 dark:text-gray-300 truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="font-bold flex-shrink-0" style={{ color: entry.color }}>
                  {entry.value} hrs
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-h-[150px] overflow-y-auto px-2 pb-2">
        {payload.map((entry, index) => {
          const isHidden = hiddenLines[entry.value]
          return (
            <button
              key={`item-${index}`}
              onClick={() => toggleLine(entry.value)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isHidden 
                  ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-400 opacity-50'
                  : 'bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800'
              }`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: isHidden ? '#9ca3af' : entry.color }} 
              />
              <span className="truncate max-w-[120px]">{entry.value}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-black dark:to-black p-4 sm:p-10">
      <div className="max-w-[1400px] mx-auto bg-white/60 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-2xl rounded-[2rem] p-6 sm:p-10 border border-white/40 dark:border-white/5">
        
        <div className="mb-10 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div>
            <Link href="/admin" className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-6 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl shadow-inner">
                  <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                    Working Rate Trends
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">
                    Daily hours logged per employee
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/50 dark:bg-[#111] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm self-start">
            <div className="flex items-center gap-2 px-2">
              <CalendarIcon className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Filter:</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
              />
              <span className="text-gray-400">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Info Box explaining calculation */}
        <div className="mb-8 bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm backdrop-blur-sm">
           <div className="bg-purple-200 dark:bg-purple-800/50 p-2 rounded-xl text-purple-700 dark:text-purple-300 shadow-inner mt-0.5">
              <TrendingUp className="w-5 h-5" />
           </div>
           <div>
              <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-1">How this is calculated</h4>
              <p className="text-sm text-purple-800/80 dark:text-purple-200/70 leading-relaxed max-w-4xl">
                This report visualizes daily productivity trends. The system aggregates all individual work sessions submitted by an employee on a specific date, adds up the total active minutes, and plots them as total daily hours. Use the legend at the bottom to toggle specific employees on or off!
              </p>
           </div>
        </div>

        {loading ? (
          <div className="h-[700px] flex flex-col items-center justify-center text-gray-500">
             <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
             <span className="font-medium animate-pulse">Loading trend data...</span>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-[#111111]/80 rounded-[2rem] p-6 sm:p-10 border border-white/50 dark:border-white/5 shadow-sm">
            <div className="h-[700px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="currentColor" className="text-gray-400" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor' }} 
                    tickLine={false}
                    axisLine={false}
                    className="text-gray-500 dark:text-gray-400 text-xs font-semibold"
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    className="text-gray-500 dark:text-gray-400 text-xs font-semibold"
                    tickFormatter={(val) => `${val}h`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.2 }} />
                  
                  <Legend content={<CustomLegend />} verticalAlign="bottom" height={100} />
                  
                  {employees.map((emp, index) => (
                    <Line
                      key={emp.id}
                      type="monotone"
                      dataKey={emp.name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      hide={hiddenLines[emp.name]}
                      animationDuration={1500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  )
}
