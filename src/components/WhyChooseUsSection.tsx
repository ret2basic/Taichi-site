import React from 'react'
import { Users, Target, Brain, Shield, ArrowRight } from 'lucide-react'
import { STATS, AUDIT_REQUEST_URL } from '@/lib/constants'

export default function WhyChooseUsSection() {
  const highlights = [
    {
      icon: Users,
      title: 'Team Audit Approach',
      accent: 'Multi-auditor coverage',
      description: 'Every audit involves ≥2 auditors. More eyes = more coverage = fewer missed bugs.',
    },
    {
      icon: Target,
      title: 'DeFiHackLabs Heritage',
      accent: 'Real hack prevention',
      description: 'Real-world exploit analysis from DeFiHackLabs. We study how protocols break so yours won\'t.',
    },
    {
      icon: Brain,
      title: 'AI-Enhanced Security',
      accent: 'Best of both worlds',
      description: 'AI tools from llm4sec.net catch low-hanging fruit. Human experts focus on the hard parts.',
    },
    {
      icon: Shield,
      title: 'Competition-Proven',
      accent: 'Proven excellence',
      description: `${STATS.competitions} contests with ${STATS.firstPlaceWins} first-place wins validate our depth across major platforms.`,
    },
  ]

  return (
    <section id="why-choose-us" className="relative py-24 bg-gray-50 dark:bg-[#090e19]">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">Why Us</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Our Edge
          </h2>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            What sets Taichi Audit apart in the DeFi security landscape
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="group rounded-xl border border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900/60 p-7 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5 shrink-0">
                  <h.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{h.title}</h3>
                  <span className="inline-block text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">{h.accent}</span>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{h.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to experience the difference?</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-lg">
              Competition-proven expertise paired with innovative methodology.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors"
            >
              Request Audit
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-200 font-semibold hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              About Us
            </a>
          </div>
        </div>
      </div>
    </section>
  )
} 