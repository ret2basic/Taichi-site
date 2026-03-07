'use client'
import React from 'react'
import Image from 'next/image'
import { ArrowUp, Twitter, Github, Mail, MessageCircle } from 'lucide-react'
import { STATS, PORTFOLIO_URL, WRITEUPS_URL, GITHUB_URL, TWITTER_URL, TELEGRAM_URL, EMAIL, DEFIHACKLABS_URL, LLM4SEC_URL } from '@/lib/constants'

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const columns = [
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Portfolio', href: PORTFOLIO_URL },
        { name: 'Blog', href: '/blog' },
        { name: 'Writeups', href: WRITEUPS_URL },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'DeFiHackLabs', href: DEFIHACKLABS_URL },
        { name: 'LLM4Sec', href: LLM4SEC_URL },
        { name: 'OnlyPwner', href: 'https://onlypwner.xyz/' },
        { name: 'Secureum', href: 'https://x.com/TheSecureum' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { name: 'Get in Touch', href: '/#contact' },
        { name: 'Email Us', href: `mailto:${EMAIL}` },
      ],
    },
  ]

  const socials = [
    { icon: Twitter, href: TWITTER_URL, label: 'Twitter' },
    { icon: Github, href: GITHUB_URL, label: 'GitHub' },
    { icon: MessageCircle, href: TELEGRAM_URL, label: 'Telegram' },
    { icon: Mail, href: `mailto:${EMAIL}`, label: 'Email' },
  ]

  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-900 dark:border-slate-800 dark:bg-[#070b14] dark:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/taichi_logo.jpg" alt="Taichi Audit Group" width={28} height={28} className="rounded-md" />
              <span className="text-base font-bold">Taichi Audit Group</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
              DeFi security audit group from DeFiHackLabs — {STATS.competitions} competitions, {STATS.firstPlaceWins} first-place wins, covering Solidity, Move &amp; Solana.
            </p>
            <div className="flex gap-2">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : '_self'}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : ''}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  aria-label={s.label}
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : '_self'}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      className="text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            © {new Date().getFullYear()} Taichi Audit Group
          </p>
          <button
            onClick={scrollToTop}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  )
} 