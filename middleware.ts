import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  try {
    // Create a response object
    const response = NextResponse.next()

    // Create a Supabase client using cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name, options) {
            response.cookies.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the user is authenticated
    if (!session) {
      // If the user is trying to access a protected route, redirect to login
      if (request.nextUrl.pathname.startsWith("/Admin")) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    } else {
      // If the user is authenticated and trying to access admin routes, check if they're an admin
      if (request.nextUrl.pathname.startsWith("/Admin")) {
        // First check if the role is in the JWT
        const role = session.user?.app_metadata?.role

        if (role === "admin") {
          // User is an admin, allow access
          return response
        }

        // If not in JWT, check the profiles table
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        // If the user is not an admin, redirect to home
        if (!profile || profile.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url))
        }
      }
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to proceed
    // The client-side auth checks will handle authentication
    return NextResponse.next()
  }
}

// Only run the middleware on these paths
export const config = {
  matcher: ["/Admin/:path*"],
}
