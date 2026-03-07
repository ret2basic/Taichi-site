import React from 'react'
import { Mail, MessageCircle, Github, Twitter, ExternalLink, ArrowRight } from 'lucide-react'
import { AUDIT_REQUEST_URL, GITHUB_URL, TWITTER_URL, TELEGRAM_URL, EMAIL } from '@/lib/constants'

export default function ContactSection() {
  const channels = [
    { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: MessageCircle, label: 'Telegram', value: 'Taichi Audit Group', href: TELEGRAM_URL },
    { icon: Github, label: 'GitHub', value: '@TaiChiAuditGroup', href: GITHUB_URL },
    { icon: Twitter, label: 'Twitter', value: '@taichiaudit', href: TWITTER_URL },
  ]

  return (
    <section id="contact" className="relative py-24 bg-white dark:bg-[#0b1120]">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">Contact</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Ready to secure your protocol? We respond within 24-48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Audit request CTA — spans 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Request an Audit</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-8">
                Open a request form and our team will scope the engagement, timeline, and quote.
              </p>
            </div>
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors"
            >
              Open Request Form
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Contact channels — spans 3 cols */}
          <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Channels</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {channels.map((ch, i) => (
                <a
                  key={i}
                  href={ch.href}
                  target={ch.href.startsWith('http') ? '_blank' : '_self'}
                  rel={ch.href.startsWith('http') ? 'noopener noreferrer' : ''}
                  className="group flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2 shrink-0">
                    <ch.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ch.label}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{ch.value}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 dark:text-slate-600 dark:group-hover:text-primary-400 transition-colors ml-auto shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency banner */}
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/50 dark:border-primary-500/20 dark:bg-primary-500/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Emergency Security Issue?</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Found a critical vulnerability in an audited protocol? Contact us immediately.</p>
          </div>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 shrink-0 px-5 py-2 rounded-lg border border-primary-300 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
          >
            Emergency Contact
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
} 