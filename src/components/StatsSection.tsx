import React from 'react'
import { TrendingUp, Users, Brain, Eye, Trophy, Star } from 'lucide-react'
import { STATS, ACHIEVEMENTS, FEATURED_WINS, AUDIT_REQUEST_URL } from '@/lib/constants'

export default function StatsSection() {
  const stats = [
    {
      icon: Trophy,
      number: STATS.competitions,
      label: 'Audit Contests',
      description: 'Code4rena, CodeHawks, Secure3, Cantina'
    },
    {
      icon: Star,
      number: STATS.contestTop3,
      label: 'Contest Top 3',
      description: 'ZKsync Era, Arbitrum BoLD, Coinbase, and more'
    },
    {
      icon: TrendingUp,
      number: STATS.totalFindings,
      label: 'Total Findings',
      description: `${STATS.highFindings} High, ${STATS.mediumFindings} Medium severity`
    },
    {
      icon: Users,
      number: STATS.auditorsPerProject,
      label: 'Auditors / Project',
      description: 'Team-based for comprehensive coverage'
    },
    {
      icon: Brain,
      number: '100%',
      label: 'AI-Enhanced',
      description: 'Every audit backed by llm4sec.net tools'
    },
    {
      icon: Eye,
      number: '24/7',
      label: 'Hack Monitoring',
      description: 'Real-world DeFi hack analysis pipeline'
    }
  ]

  return (
    <section id="portfolio" className="relative py-24 bg-white dark:bg-[#0b1120]">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">Track Record</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Proven Results
          </h2>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Consistent security excellence across the DeFi ecosystem
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group rounded-xl border border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900/60 p-6 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.number}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-1">{stat.label}</h3>
              <p className="text-sm text-gray-400 dark:text-slate-500">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Achievements + Featured Wins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {/* Achievements */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Competition Excellence</h3>
            <div className="space-y-4">
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i} className="border-l-2 border-primary-300 dark:border-primary-500/40 pl-4">
                  <h4 className="font-semibold text-gray-700 dark:text-slate-200 mb-1">{a.platform}</h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{a.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Wins */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Featured Top 3 Wins</h3>
            <div className="space-y-3">
              {FEATURED_WINS.map((win, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <div>
                    <div className="font-medium text-gray-700 dark:text-slate-200">{win.name}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{win.type}</div>
                  </div>
                  <Trophy className="w-4 h-4 text-primary-400 dark:text-primary-500/60" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:border-slate-800 dark:from-primary-900/30 dark:to-primary-800/10 p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Ready to Secure Your Protocol?
          </h3>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Get a comprehensive security audit from competition-proven experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors"
            >
              Request Audit
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-200 font-semibold hover:border-gray-400 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
} 