import React from 'react'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { STATS, AUDIT_REQUEST_URL, PORTFOLIO_URL, FEATURED_WINS } from '@/lib/constants'

export default function HeroSection() {
  const operatingSignals = [
    'Guaranteed review by 2+ researchers',
    'Exploit-pattern checks from real DeFi incidents',
    'Web3 and Web2-Web3 system coverage',
  ]

  return (
    <section id="home" className="relative overflow-hidden bg-gray-50 dark:bg-[#090e19]">
      <div className="absolute inset-0 grid-bg" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-[1.08fr,0.92fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              Incubated from a DeFiHackLabs community
            </div>

            <h1 className="mt-7 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-gray-950 dark:text-white">
              Competition-tested audits for DeFi teams shipping critical code.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              We review smart contracts, ZK integrations, exchanges, wallets, and Web2-Web3 systems
              with contest-proven researchers, past-exploit playbooks, and source-level analysis.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={AUDIT_REQUEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-colors"
              >
                Request Audit
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 font-semibold hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500 transition-colors"
              >
                View Portfolio
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {operatingSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/70 rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 dark:border-slate-800 px-5 py-4">
              <p className="text-xs font-semibold uppercase text-gray-400 dark:text-slate-500">Public proof</p>
              <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-white">Contest record and audit signal</h2>
            </div>

            <div className="grid grid-cols-2">
              {[
                { value: STATS.competitions, label: 'Audit contests' },
                { value: STATS.firstPlaceWins, label: 'First-place wins' },
                { value: STATS.contestTop3, label: 'Top 3 finishes' },
                { value: STATS.hmFindings, label: 'H/M findings' },
              ].map((stat) => (
                <div key={stat.label} className="border-b border-r border-gray-200 dark:border-slate-800 p-5 even:border-r-0">
                  <div className="text-3xl font-bold text-gray-950 dark:text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase text-gray-400 dark:text-slate-500 mb-3">Highlighted finishes</p>
              <div className="grid gap-3">
                {FEATURED_WINS.map((win) => (
                  <div key={win.name} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-gray-800 dark:text-slate-200">{win.name}</span>
                    <span className="text-gray-400 dark:text-slate-500">{win.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 dark:border-slate-800 pt-6">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              'Contest performance is used as evidence, not decoration.',
              'Past hack analysis feeds review checklists.',
              'Long-form research shows how we reason about code.',
            ].map((item) => (
              <p key={item} className="text-sm text-gray-500 dark:text-slate-400">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
