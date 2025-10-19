import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            global: { headers: { Authorization: req.headers.get('Authorization') } },
        }
    )

    const token = req.cookies.get('sb-access-token')?.value

    // If no session cookie found
    if (!token) {
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
            // Redirect logged-out user trying to access dashboard → login page
            return NextResponse.redirect(new URL('/', req.url))
        }
        return NextResponse.next()
    }

    // Logged in user:
    if (req.nextUrl.pathname === '/') {
        // Redirect logged-in user trying to visit login → dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard/:path*'], // applies only to these routes
}
