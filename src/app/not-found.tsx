'use client'
import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Shield, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Shield className="h-12 w-12 text-primary-600 mr-3" />
            <span className="text-2xl font-bold gradient-text">Taichi Audit</span>
          </div>
          
          {/* 404 Error */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              404
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 mx-auto rounded-full mb-6" />
          </div>
          
          {/* Error Message */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          {/* Search Suggestions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">Popular Pages</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Home className="h-5 w-5 text-primary-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Home</span>
              </Link>
              <Link href="/#services" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Shield className="h-5 w-5 text-primary-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Services</span>
              </Link>
              <Link href="/blog" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Search className="h-5 w-5 text-primary-600 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">Blog</span>
              </Link>
              <Link href="/#contact" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <ArrowLeft className="h-5 w-5 text-primary-600 mr-2" />
                Contact
              </Link>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-full font-semibold hover:bg-primary-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
          </div>
          
          {/* Contact Info */}
          <div className="mt-12 p-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl text-white">
            <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
            <p className="opacity-90 mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <Link
              href="/#contact"
              className="bg-white text-primary-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200 inline-block"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 