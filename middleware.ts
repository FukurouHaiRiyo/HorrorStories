import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  try {
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
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    const fullPath = request.nextUrl.href

    if (!session) {
      if (pathname.startsWith("/admin")) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", encodeURIComponent(fullPath))
        return NextResponse.redirect(redirectUrl)
      }
      return response
    }

    if (pathname.startsWith("/admin")) {
      const role = session.user?.app_metadata?.role

      if (role === "admin") {
        return response
      }

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
          `Access denied: User ${session.user.id} attempted to access ${pathname} without admin role.`
        )
        return NextResponse.redirect(new URL("/", request.url))
      }

      return response
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    return response
  }
}

export const config = {
  matcher: ["/admin/:path*"],
}
