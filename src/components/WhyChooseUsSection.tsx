import React from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Trophy } from 'lucide-react'
import { ACHIEVEMENTS, AUDIT_REQUEST_URL, FEATURED_WINS, PORTFOLIO_URL, STATS } from '@/lib/constants'

export default function WhyChooseUsSection() {
  return (
    <section id="why-choose-us" className="bg-gray-50 py-24 dark:bg-[#090e19]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Proof</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              We prefer evidence over broad claims.
            </h2>
            <p className="mt-5 text-gray-600 dark:text-slate-300 leading-relaxed">
              The signal we want clients to inspect is public: contest placements, long-form source
              walkthroughs, CTF performance, and hack analyses.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500"
              >
                Portfolio
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500"
              >
                Research
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-3">
              {[
                { value: STATS.firstPlaceWins, label: 'First-place contest wins' },
                { value: STATS.contestTop3Label, label: 'Audit contest Top 3 results' },
                { value: STATS.remedyCTF2025, label: 'Remedy CTF 2025 finish' },
              ].map((item) => (
                <div key={item.label} className="bg-white p-5 dark:bg-slate-900/70">
                  <div className="text-3xl font-bold text-gray-950 dark:text-white">{item.value}</div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                  <Trophy className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  Highlighted Top 3 finishes
                </div>
                <div className="space-y-3">
                  {FEATURED_WINS.map((win) => (
                    <div key={win.name} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{win.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{win.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                  <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  Operating principles
                </div>
                <div className="space-y-4">
                  {ACHIEVEMENTS.map((item) => (
                    <div key={item.platform}>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{item.platform}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-lg border border-primary-200 bg-primary-50 p-8 dark:border-primary-500/20 dark:bg-primary-500/10 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-950 dark:text-white">Want this review model on your protocol?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-slate-300">
              Share repository scope, target chain, key integrations, and launch timeline. We will respond with availability and next steps.
            </p>
          </div>
          <a
            href={AUDIT_REQUEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500 md:mt-0"
          >
            Request Audit
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
