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
        <section className="relative py-20 bg-gray-50 dark:bg-[#090e19] overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">About</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight text-gray-950 dark:text-white">
                Security research first. Audit delivery built around that.
              </h1>
              <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mb-10 leading-relaxed">
                Taichi Audit is a DeFi security group with public contest results, CTF performance,
                exploit analysis, and source-level research across smart contracts, ZK integrations,
                exchanges, wallets, and Web2-Web3 systems.
              </p>
              <div className="grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-slate-800 dark:bg-slate-800 md:grid-cols-4">
                <div className="bg-white p-5 dark:bg-slate-900/70">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{STATS.competitions}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Audit contests</div>
                </div>
                <div className="bg-white p-5 dark:bg-slate-900/70">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{STATS.firstPlaceWins}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">First-place wins</div>
                </div>
                <div className="bg-white p-5 dark:bg-slate-900/70">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{STATS.contestTop3Label}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Top 3 results</div>
                </div>
                <div className="bg-white p-5 dark:bg-slate-900/70">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{STATS.remedyCTF2025}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Remedy CTF 2025</div>
                </div>
                <div className="bg-white p-5 dark:bg-slate-900/70 md:col-span-4">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white mb-1">{STATS.hmFindings}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">High / Medium findings</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AboutSection />
      </main>

      <Footer />
    </div>
  )
}
