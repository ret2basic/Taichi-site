import React from 'react'
import Navigation from '@/components/Navigation'
import AboutSection from '@/components/AboutSection'
import Footer from '@/components/Footer'
import { STATS } from '@/lib/constants'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090e19] text-gray-900 dark:text-white">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 bg-gray-50 dark:bg-[#090e19] overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-500/10 rounded-full blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">About</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                Taichi Audit
              </h1>
              <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto mb-10">
                Born from the DeFiHackLabs community — next-generation security researchers with a proven competitive track record.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{STATS.competitions}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">Competitions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{STATS.contestTop3Label}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">Contests Top 3</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{STATS.totalFindings}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">Findings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{STATS.remedyCTF2025}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">Remedy CTF 2025</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use AboutSection Component */}
        <AboutSection />
      </main>

      <Footer />
    </div>
  )
} 