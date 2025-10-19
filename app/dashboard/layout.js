export const metadata = {
    title: 'Dashboard | Renoweb',
    description: 'Employee attendance dashboard',
}

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900 antialiased">
            <div className="relative min-h-screen flex flex-col">
                {/* Optional top blur overlay for glassy effect */}
                <div className="absolute inset-0 backdrop-blur-xl bg-white/10 pointer-events-none" />

                {/* Main content container */}
                <main className="relative z-10 flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
