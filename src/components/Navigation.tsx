'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'
import { AUDIT_REQUEST_URL, PORTFOLIO_URL, WRITEUPS_URL } from '@/lib/constants'

function isExternal(href: string) {
  return href.startsWith('http')
}

function NavLink({ href, className, children, onClick }: {
  href: string
  className: string
  children: React.ReactNode
  onClick?: () => void
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setIsMenuOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Portfolio', href: PORTFOLIO_URL },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Writeups', href: WRITEUPS_URL },
    { name: 'Contact', href: '/#contact' },
  ]

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/taichi_logo.jpg" alt="Taichi Audit" width={28} height={28} className="rounded-md" priority />
            <span className="text-base font-bold text-gray-900 dark:text-white">Taichi Audit</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </NavLink>
            ))}
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 transition-colors"
            >
              Request Audit
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <DarkModeToggle />
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 dark:border-slate-800/60 dark:bg-slate-900/95 backdrop-blur-lg">
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-white rounded-lg dark:hover:bg-slate-800/60 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Request Audit →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
} 