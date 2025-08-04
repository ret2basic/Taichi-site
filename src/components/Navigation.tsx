'use client'
import React, { useState, useEffect } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Portfolio', href: 'https://github.com/TaiChiAuditGroup/Portfolio' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Writeups', href: 'https://ret2basic.gitbook.io/ctfwriteup' },
    { name: 'Contact', href: '/#contact' },
  ]

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-lg shadow-lg dark:bg-slate-900/80' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/taichi_logo.jpg" 
                alt="Taichi Audit Group" 
                className="h-8 w-8 mr-2 rounded-md"
              />
              <span className="text-xl font-bold gradient-text">Taichi Audit</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : '_self'}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : ''}
                  className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform?pli=1&ts=670e18d0&pli=1&edit_requested=true"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center"
              >
                Request Audit
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile menu button and dark mode toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <DarkModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-lg shadow-lg dark:bg-slate-900/95">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : '_self'}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : ''}
                className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <a
              href="https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform?pli=1&ts=670e18d0&pli=1&edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Request Audit
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </nav>
  )
} 