'use client'
import React from 'react'
import { TrendingUp, Shield, Users, Award, DollarSign, FileText, Clock, Star, Trophy, Brain, Target, Eye, Zap } from 'lucide-react'

export default function StatsSection() {
  const stats = [
    {
      icon: Trophy,
      number: '60+',
      label: 'Audit Competitions',
      description: 'Participated across Code4rena, CodeHawks, Secure3, and Cantina platforms'
    },
    {
      icon: Star,
      number: '12',
      label: 'Contest Top 3',
      description: 'ZKsync Era, Maia DAO, Arbitrum BoLD, Arcadexyz, and Zeeknetwork'
    },
    {
      icon: TrendingUp,
      number: '135+',
      label: 'Total Findings',
      description: '60+ High severity and 75+ Medium severity vulnerabilities identified'
    },
    {
      icon: Users,
      number: '≥2',
      label: 'Auditors per Project',
      description: 'Team-based approach ensures comprehensive coverage and quality'
    },
    {
      icon: Brain,
      number: '100%',
      label: 'AI-Enhanced',
      description: 'Every audit backed by advanced AI tools from llm4sec.net'
    },
    {
      icon: Eye,
      number: '24/7',
      label: 'Hack Monitoring',
      description: 'Continuous analysis of real-world DeFi hacks and vulnerabilities'
    }
  ]

  const achievements = [
    {
      platform: 'Audit contests',
      description: '12 times Top 3 wins, team members constantly participate in audit contests on all platforms.'
    },
    {
      platform: 'Web3 CTFs',
      description: 'Remedy CTF 2025 #7, Blaz CTF 2024 4th, Secureum RACEs 4 times Top 3 wins.'
    },
    {
      platform: 'Our specialization',
      description: 'We enjoy finding bugs in Solidity, Move, and Solana codebases. Anything DeFi is welcome.'
    },
    {
      platform: 'Our philosophy',
      description: 'We believe that the best way to demonstrate security expertise is to participate in audit contests and CTFs. No public record, no skills.'
    }
  ]

  return (
    <section id="portfolio" className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Proven <span className="gradient-text">Track Record</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our numbers speak for themselves - delivering consistent security excellence across the DeFi ecosystem
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded-2xl">
                    <stat.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      {stat.number}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {stat.label}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Competition Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">Competition Excellence</h3>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{achievement.platform}</h4>
                  <p className="text-sm opacity-90">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Featured Contest Top 3
            </h3>
            <div className="space-y-4">
              {[
                { name: 'ZKsync Era', type: 'L2 Scaling Solution' },
                { name: 'Maia DAO', type: 'DeFi Governance' },
                { name: 'Arbitrum BoLD', type: 'Dispute Resolution' },
                { name: 'Arcadexyz', type: 'NFT Gaming Platform' },
                { name: 'Zeeknetwork', type: 'Cross-chain Protocol' }
              ].map((win, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{win.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{win.type}</div>
                  </div>
                  <Trophy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Protocol?
            </h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the ranks of secured DeFi protocols. Get a comprehensive security audit from proven experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center"
              >
                Request Audit
              </a>
              <a
                href="/about"
                className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-200 inline-flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 