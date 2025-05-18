import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  try {
    // Create Supabase client using request cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            // We'll set cookies later using response object when needed
          },
          remove(name, options) {
            // Same here
          },
        },
      },
    )

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    const fullPath = request.nextUrl.href

    // If user is not logged in and accessing protected route
    if (!session) {
      if (pathname.startsWith("/admin")) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", encodeURIComponent(fullPath))
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }

    // Authenticated, check for admin routes
    if (pathname.startsWith("/admin")) {
      // First check role in JWT
      const role = session.user?.app_metadata?.role

      if (role === "admin") {
        const response = NextResponse.next()
        return response
      }

      // If not in JWT, check in 'profiles' table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Failed to fetch user role from DB:", error)
        return NextResponse.redirect(new URL("/", request.url))
      }

      if (!profile || profile.role !== "admin") {
        console.warn(
          `Access denied: User ${session.user.id} attempted to access ${pathname} without admin role.`,
        )
        return NextResponse.redirect(new URL("/", request.url))
      }

      // Passed admin check
      const response = NextResponse.next()
      return response
    }

    // For all other authenticated access
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

// Apply middleware only to admin routes
export const config = {
  matcher: ["/admin/:path*"],
}
