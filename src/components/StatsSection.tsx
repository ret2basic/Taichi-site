'use client'
import React from 'react'
import { TrendingUp, Shield, Users, Award, DollarSign, FileText, Clock, Star } from 'lucide-react'

export default function StatsSection() {
  const stats = [
    {
      icon: Shield,
      number: '50+',
      label: 'Audits Completed',
      description: 'Comprehensive security reviews across multiple blockchain ecosystems'
    },
    {
      icon: TrendingUp,
      number: '100+',
      label: 'Critical Vulnerabilities',
      description: 'High-severity security issues identified and resolved'
    },
    {
      icon: DollarSign,
      number: '$50M+',
      label: 'Value Secured',
      description: 'Total value locked in audited protocols'
    },
    {
      icon: Users,
      number: '25+',
      label: 'Client Projects',
      description: 'DeFi protocols and projects successfully audited'
    },
    {
      icon: Award,
      number: '100%',
      label: 'Success Rate',
      description: 'Zero security incidents in audited contracts post-audit'
    },
    {
      icon: Clock,
      number: '48h',
      label: 'Response Time',
      description: 'Average time to initial security assessment'
    }
  ]

  const achievements = [
    {
      icon: Star,
      title: 'DeFiHackLabs Incubated',
      description: 'Emerging from the renowned DeFiHackLabs security research community'
    },
    {
      icon: Award,
      title: 'Multi-Chain Expertise',
      description: 'Deep knowledge across Ethereum, Solana, Aptos, and Sui ecosystems'
    },
    {
      icon: Shield,
      title: 'Zero Incidents',
      description: 'No security breaches in protocols audited by our team'
    },
    {
      icon: Users,
      title: 'Community Trusted',
      description: 'Recognized by leading DeFi protocols and development teams'
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

        {/* Achievements */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="gradient-text">Taichi Audit</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our unique position in the DeFi security landscape gives us unparalleled insights and capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0">
                  <achievement.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {achievement.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Protocol?
            </h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the ranks of secured DeFi protocols. Get a comprehensive security audit from the experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center"
              >
                Get Started Today
              </a>
              <a
                href="#about"
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