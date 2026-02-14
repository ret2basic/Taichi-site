'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface DarkModeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from the class the blocking <script> already set on <html>
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Sync state with what the blocking script already applied
    const hasDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(hasDark)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Apply dark class to html element
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // Save to localStorage
      localStorage.setItem('darkMode', isDarkMode.toString())
    }
  }, [isDarkMode, mounted])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  // Always provide the context — even before mount — so useDarkMode() never throws.
  // The blocking <script> in layout.tsx already set the correct `dark` class on <html>
  // before paint, so there is no FOUC.
  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
} 