'use client'
import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Shield, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090e19] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full filter blur-3xl opacity-5 animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-primary-400 rounded-full filter blur-3xl opacity-5 animate-pulse delay-1000" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Shield className="h-12 w-12 text-primary-400 mr-3" />
            <span className="text-2xl font-bold gradient-text">Taichi Audit</span>
          </div>
          
          {/* 404 Error */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-400 mb-4">
              404
            </h1>
            <div className="w-32 h-1 bg-primary-500 mx-auto rounded-full mb-6" />
          </div>
          
          {/* Error Message */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          
          <p className="text-lg text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          {/* Search Suggestions */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-slate-500 mr-2" />
              <span className="text-sm text-gray-400 dark:text-slate-400">Popular Pages</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors">
                <Home className="h-4 w-4 text-primary-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-slate-300">Home</span>
              </Link>
              <Link href="/#services" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors">
                <Shield className="h-4 w-4 text-primary-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-slate-300">Services</span>
              </Link>
              <Link href="/blog" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors">
                <Search className="h-4 w-4 text-primary-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-slate-300">Blog</span>
              </Link>
              <Link href="/#contact" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors">
                <ArrowLeft className="h-4 w-4 text-primary-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-slate-300">Contact</span>
              </Link>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
          
          {/* Contact Info */}
          <div className="mt-12 p-6 rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50/50 dark:bg-primary-500/5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-primary-300 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 