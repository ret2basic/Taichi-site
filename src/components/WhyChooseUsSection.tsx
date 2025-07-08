'use client'
import React from 'react'
import { Users, Target, Brain, Shield, ArrowRight } from 'lucide-react'

export default function WhyChooseUsSection() {
  const highlights = [
    {
      icon: Users,
      title: 'Team Audit Approach',
      description: 'More eyes = more coverage. Every audit involves ≥2 auditors for comprehensive security analysis.',
      accent: 'Multi-auditor coverage'
    },
    {
      icon: Target,
      title: 'DeFiHackLabs Heritage',
      description: 'Real-world hack analysis from DeFiHackLabs community. Our goal: keep your name out of exploit databases.',
      accent: 'Real hack prevention'
    },
    {
      icon: Brain,
      title: 'AI-Enhanced Security',
      description: 'Strategic use of AI tools from llm4sec.net to catch obvious bugs while relying on human expertise.',
      accent: 'Best of both worlds'
    },
    {
      icon: Shield,
      title: 'Competition-Proven',
      description: '60+ competitions with 12 first-place wins across major platforms validate our security expertise.',
      accent: 'Proven excellence'
    }
  ]

  return (
    <section id="why-choose-us" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose <span className="gradient-text">Taichi Audit</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our unique position in the DeFi security landscape gives us unparalleled insights and capabilities
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {highlights.map((highlight, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors duration-300">
                    <highlight.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {highlight.title}
                    </h3>
                    <div className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">
                      {highlight.accent}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-primary-200 dark:border-slate-600">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Experience the Difference?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Get a security audit from a team that combines competition-proven expertise with innovative methodology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-700 transition-colors duration-200 inline-flex items-center justify-center group"
              >
                Request Audit
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/about"
                className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors duration-200 inline-flex items-center justify-center"
              >
                Learn More About Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 