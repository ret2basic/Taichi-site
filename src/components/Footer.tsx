'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowUp, Twitter, Github, Linkedin, Mail, MessageCircle } from 'lucide-react'
import { STATS, PORTFOLIO_URL, WRITEUPS_URL, GITHUB_URL, TWITTER_URL, TELEGRAM_URL, EMAIL, DEFIHACKLABS_URL, LLM4SEC_URL } from '@/lib/constants'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Portfolio', href: PORTFOLIO_URL },
      { name: 'Blog', href: '/blog' },
      { name: 'Writeups', href: WRITEUPS_URL },
    ],
    resources: [
      { name: 'DeFiHackLabs', href: DEFIHACKLABS_URL },
      { name: 'LLM4Sec', href: LLM4SEC_URL },
      { name: 'OnlyPwner', href: 'https://onlypwner.xyz/' },
      { name: 'Secureum', href: 'https://x.com/TheSecureum' },
    ],
    contact: [
      { name: 'Get in Touch', href: '/#contact' },
      { name: 'Email Us', href: `mailto:${EMAIL}` }
    ]
  }

  const socialLinks = [
    { icon: Twitter, href: TWITTER_URL, name: 'Twitter' },
    { icon: Github, href: GITHUB_URL, name: 'GitHub' },
    { icon: MessageCircle, href: TELEGRAM_URL, name: 'Telegram' },
    { icon: Mail, href: `mailto:${EMAIL}`, name: 'Email' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/taichi_logo.jpg" 
                  alt="Taichi Audit Group" 
                  className="h-8 w-8 mr-2 rounded-md"
                />
                <span className="text-xl font-bold">Taichi Audit Group</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                Leading DeFi security audit group from DeFiHackLabs community with {STATS.competitions} competitions, {STATS.firstPlaceWins} first-place wins, and team-based audit approach across Solidity, Move, and Solana ecosystems.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : '_self'}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : ''}
                    className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : '_self'}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                {footerLinks.contact.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('mailto') ? '_self' : '_blank'}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-300 text-sm">
                © {new Date().getFullYear()} Taichi Audit Group. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={scrollToTop}
                className="bg-primary-600 hover:bg-primary-700 p-2 rounded-lg transition-colors duration-200"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 