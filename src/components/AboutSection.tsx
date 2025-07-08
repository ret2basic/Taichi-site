'use client'
import React from 'react'
import { Users, BookOpen, Target, Zap, Shield, Code, Award, Globe, Brain, Eye, Trophy } from 'lucide-react'

export default function AboutSection() {
  const teamMembers = [
    {
      name: 'Competition Champions',
      role: 'Lead Security Researchers',
      expertise: 'Multi-chain Security, Competition Winners',
      description: '60+ audit competitions with 11 Top 3 wins including 6 first places across major platforms: ZKsync Era, Maia DAO, Arbitrum BoLD, Arcadexyz, Coinbase SpendPermission, OneWorld'
    },
    {
      name: 'DeFiHackLabs Veterans',
      role: 'Hack Analysis Specialists',
      expertise: 'Real-world Attack Vectors, Incident Response',
      description: 'Core contributors from DeFiHackLabs community with deep knowledge of past DeFi exploits and prevention strategies'
    },
    {
      name: 'AI Security Engineers',
      role: 'LLM4Sec Integration Team',
      expertise: 'AI-Enhanced Auditing, Tool Development',
      description: 'Specialists in integrating AI tools from llm4sec.net to enhance traditional audit methodologies'
    }
  ]

  const values = [
    {
      icon: Users,
      title: 'Team-First Approach',
      description: 'More eyes = more coverage. Every audit requires ≥2 auditors for comprehensive security analysis'
    },
    {
      icon: Eye,
      title: 'Continuous Monitoring',
      description: 'Real-time analysis of DeFi hacks from our DeFiHackLabs background to prevent future incidents'
    },
    {
      icon: Brain,
      title: 'AI-Enhanced Security',
      description: 'Strategic use of AI tools from llm4sec.net to catch obvious bugs while relying on human expertise'
    },
    {
      icon: Trophy,
      title: 'Proven Excellence',
      description: 'Track record of 60+ competitions, 135+ findings, and 11 Top 3 wins including 6 first places'
    }
  ]

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About <span className="gradient-text">Taichi Audit</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Born from the DeFiHackLabs community, we represent the next generation of security researchers with a proven track record in competitive auditing
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Left Column - Story */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl mr-4">
                  <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">DeFiHackLabs Heritage</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Taichi Audit Group emerged from the renowned DeFiHackLabs community, where our team members continuously monitor and analyze real-world DeFi hacks. This unique background gives us unparalleled insights into attack vectors and vulnerabilities that have actually been exploited in production.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Our goal is simple:</strong> Keep our client's protocol names out of the DeFiHackLabs GitHub repository by preventing vulnerabilities before they can be exploited.
              </p>
            </div>

            <div className="bg-gradient-to-r from-secondary-50 to-primary-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-secondary-100 dark:bg-secondary-900 p-3 rounded-xl mr-4">
                  <Users className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Team Audit Philosophy</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We believe in the principle that <strong>"more eyes = more coverage"</strong>. Every audit we conduct involves at least 2 auditors, with team size scaling based on the codebase's nSLOC and design complexity.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                This team-based approach ensures comprehensive coverage and significantly reduces the chance of missing critical vulnerabilities that single auditors might overlook.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl mr-4">
                  <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Enhanced Security</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We don't rely solely on AI tools, but we use them strategically to ensure we don't miss obvious bugs in client codebases. Our AI tools, primarily sourced from <a href="https://llm4sec.net/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">llm4sec.net</a>, serve as an additional layer of security analysis.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Each audit we perform provides more data to improve our AI tools, creating a continuous feedback loop that enhances our security capabilities.
              </p>
            </div>
          </div>

          {/* Right Column - Values */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Core Principles</h3>
            {values.map((value, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0">
                  <value.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Methodologies - Detailed */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our <span className="gradient-text">Security Methodology</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three core principles that set us apart in the DeFi security landscape
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Users,
                title: 'Team Audit Approach',
                description: 'We believe in "more eyes = more coverage". Each audit is conducted by ≥2 auditors based on codebase nSLOC and design difficulty, ensuring comprehensive security coverage.',
                highlight: 'Multi-auditor coverage'
              },
              {
                icon: Target,
                title: 'Past Hack Analysis',
                description: 'Our team members from DeFiHackLabs community continuously monitor real-world hacks and their root causes. Our goal: keeping client names out of DeFiHackLabs github repo.',
                highlight: 'DeFiHackLabs expertise'
              },
              {
                icon: Brain,
                title: 'AI-Backed Security',
                description: 'We don\'t rely solely on AI tools, but use them strategically to ensure we don\'t miss obvious bugs. Our AI tools from llm4sec.net improve with each audit we perform.',
                highlight: 'llm4sec.net integration'
              },
              {
                icon: Shield,
                title: 'Multi-Chain Expertise',
                description: 'Deep security knowledge across Solidity (Ethereum/EVM), Move (Aptos/Sui), Solana (Rust), and emerging blockchain ecosystems with proven track record.',
                highlight: 'Cross-chain security'
              }
            ].map((methodology, index) => (
              <div key={index} className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-xl flex-shrink-0">
                    <methodology.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {methodology.title}
                    </h4>
                    <div className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">
                      {methodology.highlight}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {methodology.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Expert <span className="gradient-text">Security Team</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our team combines competition excellence with real-world security expertise across multiple blockchain ecosystems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {member.name}
                </h4>
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-medium">Expertise:</span> {member.expertise}
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Technology <span className="gradient-text">Expertise</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Proven expertise across the most important blockchain ecosystems with competition wins to validate our skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Solidity', desc: 'Ethereum & EVM Chains', wins: 'ZKsync Era, Arbitrum BoLD' },
              { name: 'Move', desc: 'Aptos & Sui', wins: 'Competitive Analysis' },
              { name: 'Rust', desc: 'Solana Programs', wins: 'Cross-chain Security' },
              { name: 'Cairo', desc: 'StarkNet', wins: 'L2 Scaling Solutions' }
            ].map((tech, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded-2xl inline-flex mb-4">
                  <Code className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {tech.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {tech.desc}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {tech.wins}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Competition Track Record */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Competition Track Record
            </h3>
            <p className="text-xl opacity-90">
              Our success in competitive auditing validates our security expertise
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">60+</div>
              <div className="text-sm opacity-90">Total Competitions</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">11 times</div>
              <div className="text-sm opacity-90">Audit Contests Top 3</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">135+</div>
              <div className="text-sm opacity-90">Findings Reported</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">#7</div>
              <div className="text-sm opacity-90">Remedy CTF 2025</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 