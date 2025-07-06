'use client'
import React, { useState } from 'react'
import { Mail, MessageCircle, Send, MapPin, Phone, Clock, Twitter, Github, Linkedin } from 'lucide-react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectName: '',
    blockchainType: '',
    projectDescription: '',
    timeline: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    // Reset form
    setFormData({
      name: '',
      email: '',
      projectName: '',
      blockchainType: '',
      projectDescription: '',
      timeline: '',
      message: ''
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'hello@taichi-audit.com',
      description: 'Get in touch with our team'
    },
    {
      icon: MessageCircle,
      title: 'Telegram',
      value: '@TaichiAudit',
      description: 'Join our community chat'
    },
    {
      icon: Clock,
      title: 'Response Time',
      value: '24-48 hours',
      description: 'Average response time'
    }
  ]

  const socialLinks = [
    { icon: Twitter, href: '#', name: 'Twitter' },
    { icon: Github, href: '#', name: 'GitHub' },
    { icon: Linkedin, href: '#', name: 'LinkedIn' }
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
            Ready to secure your DeFi protocol? Let's discuss your security needs and create a customized audit plan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Request an Audit
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="DeFi Protocol"
                  />
                </div>
                <div>
                  <label htmlFor="blockchainType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Blockchain Type
                  </label>
                  <select
                    id="blockchainType"
                    name="blockchainType"
                    value={formData.blockchainType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Blockchain</option>
                    <option value="ethereum">Ethereum (Solidity)</option>
                    <option value="aptos">Aptos (Move)</option>
                    <option value="sui">Sui (Move)</option>
                    <option value="solana">Solana (Rust)</option>
                    <option value="starknet">StarkNet (Cairo)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Description
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your project, its functionality, and any specific security concerns..."
                />
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Desired Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Timeline</option>
                  <option value="asap">ASAP</option>
                  <option value="1-2weeks">1-2 weeks</option>
                  <option value="2-4weeks">2-4 weeks</option>
                  <option value="1-2months">1-2 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any additional information or questions..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center group"
              >
                Send Request
                <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Contact Information
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {info.title}
                      </h4>
                      <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">
                        {info.value}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Follow Us
              </h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <social.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </a>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                Stay updated with our latest security research and findings.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-8 md:p-12 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Emergency Security Issues?
              </h3>
              <p className="mb-6 opacity-90">
                If you've discovered a critical vulnerability in one of our audited protocols, please contact us immediately via our emergency security hotline.
              </p>
              <a
                href="mailto:emergency@taichi-audit.com"
                className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 inline-block"
              >
                Emergency Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 