"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { SearchBar } from "@/components/search-bar"

export function MainNav() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-red-500">
          <span>NightmareNarrator</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <Link href="/" className="text-sm font-medium text-white/90 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/stories" className="text-sm font-medium text-white/90 transition-colors hover:text-white">
              Stories
            </Link>
            <Link href="/categories" className="text-sm font-medium text-white/90 transition-colors hover:text-white">
              Categories
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/90 transition-colors hover:text-white">
              About
            </Link>
          </nav>
          <SearchBar />
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-white hover:text-white/90">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" className="text-white hover:text-white/90">
                  {profile?.username || user.email}
                </Button>
              </Link>
              <Button onClick={() => signOut()} className="bg-red-600 text-white hover:bg-red-700">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white/90">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-red-600 text-white hover:bg-red-700">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-b border-gray-800">
          <div className="container px-4 py-4 flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/stories"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>

            <div className="border-t border-gray-800 my-2"></div>

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="text-sm font-medium text-red-500 transition-colors hover:text-red-400 py-2 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/90 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-red-500 transition-colors hover:text-red-400 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
