'use client'
import React from 'react'
import { Code, Shield, Zap, CheckCircle, AlertTriangle, Bug } from 'lucide-react'

export default function ServicesSection() {
  const services = [
    {
      icon: Code,
      title: 'Solidity Audits',
      description: 'Comprehensive security reviews for Ethereum and EVM-compatible smart contracts',
      features: [
        'Re-entrancy vulnerability detection',
        'Gas optimization analysis',
        'Access control verification',
        'Logic flaw identification'
      ],
      color: 'primary'
    },
    {
      icon: Zap,
      title: 'Move Security',
      description: 'Specialized audits for Aptos and Sui blockchain Move smart contracts',
      features: [
        'Resource safety validation',
        'Capability-based security',
        'Module dependency analysis',
        'Performance optimization'
      ],
      color: 'secondary'
    },
    {
      icon: Shield,
      title: 'Solana Programs',
      description: 'Expert security assessments for Solana blockchain programs and dApps',
      features: [
        'Account validation checks',
        'Cross-program invocation security',
        'Rent exemption verification',
        'Signer verification analysis'
      ],
      color: 'primary'
    }
  ]

  const auditProcess = [
    {
      step: '01',
      title: 'Initial Assessment',
      description: 'We analyze your project scope, timeline, and requirements to provide a detailed audit proposal.'
    },
    {
      step: '02',
      title: 'Manual Review',
      description: 'Our security experts conduct thorough line-by-line code review using manual techniques.'
    },
    {
      step: '03',
      title: 'Automated Testing',
      description: 'We employ advanced static analysis tools and fuzzing techniques to identify vulnerabilities.'
    },
    {
      step: '04',
      title: 'Report & Remediation',
      description: 'Comprehensive report with detailed findings, severity ratings, and remediation guidance.'
    }
  ]

  return (
    <section id="services" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our <span className="gradient-text">Security Services</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive security audits across multiple blockchain ecosystems with deep expertise in DeFi protocols
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                  service.color === 'primary' 
                    ? 'bg-primary-100 dark:bg-primary-900' 
                    : 'bg-secondary-100 dark:bg-secondary-900'
                }`}>
                  <service.icon className={`w-8 h-8 ${
                    service.color === 'primary' 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-secondary-600 dark:text-secondary-400'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {service.description}
                </p>
                
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Process */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our <span className="gradient-text">Audit Process</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A systematic approach to identifying vulnerabilities and ensuring maximum security for your smart contracts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {auditProcess.map((process, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    {process.step}
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {process.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {process.description}
                  </p>
                </div>
                
                {index < auditProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-primary-300 dark:bg-primary-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerability Types */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Vulnerability <span className="gradient-text">Detection</span>
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We identify and prevent the most critical security vulnerabilities in DeFi protocols
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Re-entrancy Attacks',
              'Integer Overflow/Underflow',
              'Access Control Issues',
              'Logic Errors',
              'Flash Loan Attacks',
              'Price Oracle Manipulation',
              'Front-running Vulnerabilities',
              'Governance Attacks',
              'MEV Exploitation'
            ].map((vuln, index) => (
              <div key={index} className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-gray-900 dark:text-white font-medium">{vuln}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 