# Copilot Instructions for Attendancy

## Project Overview
Attendancy is a Next.js 15 attendance tracking app using Supabase for authentication and data storage. It features employee dashboards, admin panels, and real-time attendance management with work session tracking.

## Architecture
- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL with auth, real-time subscriptions)
- **Key Tables**:
  - `employees`: User profiles (id, name, email, role, is_admin)
  - `attendance`: Daily attendance records (user_id, date, status, work_summary)
  - `work_sessions`: Time tracking (user_id, date, start_time, end_time, duration_minutes)
  - `holidays`: Company holidays (date, type)

## Authentication Flow
- Supabase auth with session-based middleware
- Middleware redirects: `/` → `/dashboard` if authenticated, `/dashboard` → `/` if not
- AuthSync component auto-syncs users to `employees` table on login
- Fires `employee-synced` event after DB sync

## Data Patterns
- **Queries**: Use `supabase.from('table').select().eq().gte().lte()` for date ranges
- **Dates**: Use dayjs for parsing/formatting (YYYY-MM-DD format)
- **Real-time**: Custom window events (`attendance-marked`, `month-changed`) for component communication
- **Loading States**: Always show loading indicators during async operations

## Attendance Logic
- **States**: DAY_START → WORKING → BREAK → LOGGED_OFF
- **Session Management**: 
  - Start work: Insert into `work_sessions` with start_time
  - Take break: Update end_time, calculate duration
  - Resume: New session
  - Log off: Require work_summary, mark in `attendance`
- **Holiday Handling**: Check `holidays` table before allowing attendance

## UI Patterns
- **Glassmorphism**: `backdrop-blur-xl bg-white/50 border border-white/30`
- **Gradients**: `bg-gradient-to-br from-blue-50 via-white to-blue-100`
- **Responsive**: Mobile-first with `lg:` breakpoints
- **Components**: GlassCard wrapper for consistent styling
- **Icons**: Lucide React icons

## Development Workflow
- **Dev**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build` (uses Turbopack)
- **Start**: `npm run start`
- **Environment**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Admin Features
- Admin check: `employees.is_admin = true`
- Employee management: View all employees, detailed attendance calendars
- Access control: Redirect non-admins to dashboard

## Key Files
- `lib/supabaseClient.js`: Supabase client instance
- `lib/AuthSync.js`: User sync on auth
- `app/middleware/middleware.js`: Route protection
- `components/AttendanceSection.js`: Core attendance state machine
- `components/CalendarSection.js`: Month-based data fetching
- `app/dashboard/page.js`: Main dashboard with stats calculation

## Conventions
- **Imports**: `@/lib/`, `@/components/` paths
- **Error Handling**: Console.error for DB errors, alert() for user-facing
- **State Management**: useState/useEffect for component state
- **Async**: Always await supabase calls, handle loading states
- **Events**: Use CustomEvent for cross-component updates