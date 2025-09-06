'use client'
import React from 'react'
import { Mail, MessageCircle, Github, Twitter, ExternalLink } from 'lucide-react'

export default function ContactSection() {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'taichiweb3sec@gmail.com',
      href: 'mailto:taichiweb3sec@gmail.com',
      description: 'Get in touch with our team'
    },
    {
      icon: MessageCircle,
      title: 'Telegram',
      value: 'Taichi Audit Group',
      href: 'https://t.me/+egUmC7vd9TI4MGM9',
      description: 'Join our community chat'
    },
    {
      icon: Github,
      title: 'GitHub',
      value: '@TaiChiAuditGroup',
      href: 'https://github.com/TaiChiAuditGroup',
      description: 'View our repositories and portfolio'
    },
    {
      icon: Twitter,
      title: 'Twitter',
      value: '@taichiaudit',
      href: 'https://x.com/taichiaudit',
      description: 'Follow us for security updates'
    }
  ]

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Ready to secure your DeFi protocol? Connect with us through any of these channels and let's discuss your security needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form CTA */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col justify-center items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Request an Audit
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              Click the button below to open our audit request form. We'll get back to you within 24-48 hours.
            </p>
            <a
              href="https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform?pli=1&ts=670e18d0&pli=1&edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center group"
            >
              Open Request Form
              <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Contact Information
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : '_self'}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : ''}
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200 group"
                  >
                    <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors duration-200">
                      <info.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                        {info.title}
                      </h4>
                      <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">
                        {info.value}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {info.description}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-8 md:p-12 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Emergency Security Issues?
              </h3>
              <p className="mb-6 opacity-90">
                If you've discovered a critical vulnerability in one of our audited protocols, please contact us immediately via our emergency channels.
              </p>
              <a
                href="https://x.com/taichiaudit"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center"
              >
                Emergency Contact
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 