import React from 'react'
import { Shield } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin`} />
        <Shield className={`absolute inset-0 ${sizeClasses[size]} text-primary-600 opacity-50`} />
      </div>
      {text && (
        <p className={`mt-2 text-gray-600 dark:text-gray-300 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Full page loading component
export function FullPageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-12 w-12 text-primary-600 mr-3" />
          <span className="text-2xl font-bold gradient-text">Taichi Audit</span>
        </div>
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

// Button loading state
export function ButtonLoading({ 
  loading, 
  children, 
  className = '', 
  ...props 
}: { 
  loading: boolean
  children: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={`relative ${className} ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  )
} 