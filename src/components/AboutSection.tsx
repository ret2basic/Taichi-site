import React from 'react'
import { Users, BookOpen, Target, Zap, Shield, Code, Award, Globe, Brain, Eye, Trophy } from 'lucide-react'
import { STATS, LLM4SEC_URL } from '@/lib/constants'

export default function AboutSection() {
  const teamMembers = [
    {
      name: 'Competition Champions',
      role: 'Senior Security Researchers',
      expertise: 'Multi-chain Security, Competition Winners',
      description: `${STATS.competitions} audit competitions with ${STATS.contestTop3Label} Top 3 wins including ${STATS.firstPlaceWins} first places across major contest platforms`
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
      description: `Track record of ${STATS.competitions} competitions, ${STATS.totalFindings} findings, and ${STATS.contestTop3Label} Top 3 wins including ${STATS.firstPlaceWins} first places`
    }
  ]

  return (
    <section id="about" className="py-20 bg-white dark:bg-[#0b1120]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">About</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Taichi Audit
          </h2>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Born from the DeFiHackLabs community — next-generation security researchers with a proven competitive track record
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Left Column - Story */}
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5">
                  <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">DeFiHackLabs Heritage</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                Taichi Audit Group emerged from the renowned DeFiHackLabs community, where our team members continuously monitor and analyze real-world DeFi hacks. This unique background gives us unparalleled insights into attack vectors and vulnerabilities that have actually been exploited in production.
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-gray-700 dark:text-slate-200">Our goal is simple:</strong> Keep our client's protocol names out of the DeFiHackLabs GitHub repository by preventing vulnerabilities before they can be exploited.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Team Audit Philosophy</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                We believe in the principle that <strong className="text-gray-700 dark:text-slate-200">"more eyes = more coverage"</strong>. Every audit we conduct involves at least 2 auditors, with team size scaling based on the codebase's nSLOC and design complexity.
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                This team-based approach ensures comprehensive coverage and significantly reduces the chance of missing critical vulnerabilities that single auditors might overlook.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5">
                  <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI-Enhanced Security</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
                We don't rely solely on AI tools, but we use them strategically to ensure we don't miss obvious bugs in client codebases. Our AI tools, primarily sourced from <a href={LLM4SEC_URL} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">llm4sec.net</a>, serve as an additional layer of security analysis.
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Each audit we perform provides more data to improve our AI tools, creating a continuous feedback loop that enhances our security capabilities.
              </p>
            </div>
          </div>

          {/* Right Column - Values */}
          <div className="space-y-5">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Core Principles</h3>
            {values.map((value, index) => (
              <div key={index} className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5 shrink-0">
                  <value.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {value.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Methodologies - Detailed */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 md:p-12 mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Our <span className="gradient-text">Security Methodology</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              Three core principles that set us apart in the DeFi security landscape
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <div key={index} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#090e19] p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-2.5 shrink-0">
                    <methodology.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {methodology.title}
                    </h4>
                    <span className="inline-block text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
                      {methodology.highlight}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                      {methodology.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Expert <span className="gradient-text">Security Team</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              Our team combines competition excellence with real-world security expertise across multiple blockchain ecosystems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamMembers.map((member, index) => (
              <div key={index} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#090e19] p-6">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/15 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h4>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                  <span className="font-medium text-gray-500 dark:text-slate-400">Expertise:</span> {member.expertise}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Technology <span className="gradient-text">Expertise</span>
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              Proven expertise across the most important blockchain ecosystems
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Solidity', desc: 'Ethereum & EVM Chains' },
              { name: 'Move', desc: 'Aptos & Sui' },
              { name: 'Rust', desc: 'Solana Programs' },
              { name: 'Cairo', desc: 'StarkNet' }
            ].map((tech, index) => (
              <div key={index} className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 text-center">
                <div className="bg-primary-50 dark:bg-primary-500/10 p-3 rounded-lg inline-flex mb-3">
                  <Code className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {tech.name}
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-400">
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Competition Track Record */}
        <div className="mt-16 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Competition Track Record
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Our success in competitive auditing validates our security expertise
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{STATS.competitions}</div>
              <div className="text-xs text-gray-400 dark:text-slate-400">Total Competitions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{STATS.contestTop3Label}</div>
              <div className="text-xs text-gray-400 dark:text-slate-400">Audit Contests Top 3</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{STATS.totalFindings}</div>
              <div className="text-xs text-gray-400 dark:text-slate-400">Findings Reported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{STATS.remedyCTF2025}</div>
              <div className="text-xs text-gray-400 dark:text-slate-400">Remedy CTF 2025</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 