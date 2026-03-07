import React from 'react'
import { ArrowRight, Shield } from 'lucide-react'
import { STATS, AUDIT_REQUEST_URL, PORTFOLIO_URL, FEATURED_WINS } from '@/lib/constants'

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gray-50 dark:bg-[#090e19]">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Subtle top-left glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary-50/50 dark:bg-primary-500/[0.07] blur-[120px]" />
      {/* Subtle bottom-right glow */}
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary-50/30 dark:bg-primary-400/[0.05] blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/60 backdrop-blur-sm text-sm text-gray-600 dark:text-slate-300">
            <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            Incubated from DeFiHackLabs Community
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.08] mb-6">
          We Secure the Protocols<br />
          <span className="gradient-text">You Depend On</span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-lg md:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          {STATS.competitions} audit contests. {STATS.contestTop3Label} Top 3. {STATS.hmFindings} H/M findings.
          <br className="hidden sm:block" />
          Solidity &middot; Move &middot; Solana — battle-tested across every major platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href={AUDIT_REQUEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary-500 text-white font-semibold text-lg hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
          >
            Request Audit
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-200 font-semibold text-lg hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            View Portfolio
          </a>
        </div>

        {/* Key stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 dark:bg-slate-800/60 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 max-w-3xl mx-auto mb-20">
          {[
            { value: STATS.competitions, label: 'Audit Contests' },
            { value: STATS.contestTop3, label: 'Contest Top 3' },
            { value: STATS.hmFindings, label: 'H/M Findings' },
            { value: STATS.auditorsPerProject, label: 'Auditors / Project' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-6 px-4 bg-white dark:bg-[#090e19]">
              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{s.value}</span>
              <span className="text-xs md:text-sm text-gray-400 dark:text-slate-500 mt-1 text-center">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Trusted-by logo strip */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-600 mb-6">
            Top 3 finishes in
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {FEATURED_WINS.map((win) => (
              <span
                key={win.name}
                className="text-sm font-medium text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                {win.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 