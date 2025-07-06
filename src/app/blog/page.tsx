import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Calendar, Clock, User, ArrowRight, Shield, AlertTriangle, Eye } from 'lucide-react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: 'Common Solidity Vulnerabilities and How to Prevent Them',
      excerpt: 'A comprehensive guide to the most dangerous smart contract vulnerabilities in Solidity and practical prevention strategies.',
      content: `
        Smart contract security is paramount in the DeFi ecosystem. In this comprehensive guide, we'll explore the most critical vulnerabilities that plague Solidity smart contracts and provide actionable prevention strategies.

        ## Re-entrancy Attacks

        Re-entrancy attacks occur when a contract calls an external contract before updating its own state. This allows the external contract to call back into the original contract and potentially drain its funds.

        ### Prevention:
        - Use the checks-effects-interactions pattern
        - Implement reentrancy guards
        - Update state before external calls

        ## Integer Overflow/Underflow

        Before Solidity 0.8.0, arithmetic operations could overflow or underflow without reverting, leading to unexpected behavior.

        ### Prevention:
        - Use Solidity 0.8.0+ with built-in overflow protection
        - Use OpenZeppelin's SafeMath library for older versions
        - Implement proper bounds checking

        ## Access Control Issues

        Improper access control can allow unauthorized users to call sensitive functions.

        ### Prevention:
        - Use OpenZeppelin's AccessControl contracts
        - Implement role-based access control
        - Regularly audit access control logic
      `,
      author: 'Taichi Security Team',
      date: '2024-01-15',
      readTime: '8 min read',
      category: 'Security',
      tags: ['Solidity', 'DeFi', 'Security', 'Smart Contracts'],
      views: 1250,
      featured: true
    },
    {
      id: 2,
      title: 'Move Language Security: Best Practices for Aptos and Sui',
      excerpt: 'Exploring the unique security features of the Move programming language and how to leverage them for safer smart contracts.',
      content: `
        The Move programming language, designed by Facebook (now Meta) for blockchain applications, introduces novel security concepts that differentiate it from other smart contract languages.

        ## Resource Safety

        Move's resource-oriented programming model ensures that digital assets cannot be copied or lost, only moved between accounts.

        ### Key Features:
        - Linear types prevent asset duplication
        - Automatic resource cleanup
        - Compile-time guarantees for asset safety

        ## Capability-Based Security

        Move implements capability-based security, where access is controlled through unforgeable tokens rather than access control lists.

        ### Benefits:
        - Reduced attack surface
        - Clear ownership semantics
        - Composable security patterns

        ## Module System

        Move's module system provides strong encapsulation and prevents unauthorized access to internal functions.

        ### Best Practices:
        - Use friend functions judiciously
        - Implement proper module boundaries
        - Leverage Move's type system for security
      `,
      author: 'Move Security Expert',
      date: '2024-01-10',
      readTime: '6 min read',
      category: 'Move',
      tags: ['Move', 'Aptos', 'Sui', 'Security'],
      views: 890,
      featured: true
    },
    {
      id: 3,
      title: 'Solana Program Security: Common Pitfalls and Solutions',
      excerpt: 'Understanding the unique security challenges in Solana programs and how to build secure decentralized applications.',
      content: `
        Solana's account model and runtime environment present unique security challenges that developers must understand to build secure programs.

        ## Account Validation

        Proper account validation is crucial in Solana programs to prevent unauthorized access and data corruption.

        ### Common Issues:
        - Missing signer checks
        - Incorrect account ownership verification
        - Improper data deserialization

        ## Cross-Program Invocation (CPI) Security

        CPI allows programs to call other programs, but this introduces security risks if not handled properly.

        ### Best Practices:
        - Validate all accounts in CPI calls
        - Use program-derived addresses (PDAs) securely
        - Implement proper error handling

        ## Rent Exemption

        Solana accounts must maintain a minimum balance to avoid being purged from the blockchain.

        ### Security Implications:
        - Ensure critical accounts are rent-exempt
        - Handle rent collection properly
        - Prevent rent draining attacks
      `,
      author: 'Solana Security Team',
      date: '2024-01-05',
      readTime: '7 min read',
      category: 'Solana',
      tags: ['Solana', 'Rust', 'Security', 'Programs'],
      views: 650,
      featured: false
    },
    {
      id: 4,
      title: 'The Future of DeFi Security: Emerging Threats and Solutions',
      excerpt: 'Analyzing the evolving landscape of DeFi security threats and the innovative solutions being developed to combat them.',
      content: `
        As the DeFi ecosystem continues to evolve, new security challenges emerge that require innovative solutions and proactive defense strategies.

        ## MEV and Front-Running

        Maximal Extractable Value (MEV) and front-running attacks exploit transaction ordering to extract value from users.

        ### Mitigation Strategies:
        - Implement commit-reveal schemes
        - Use time-locked transactions
        - Leverage MEV-protection services

        ## Cross-Chain Security

        Multi-chain protocols face unique security challenges with bridge vulnerabilities and cross-chain communication.

        ### Key Considerations:
        - Bridge security models
        - Cross-chain message validation
        - Atomic cross-chain transactions

        ## Governance Attacks

        Decentralized governance mechanisms can be exploited through various attack vectors.

        ### Prevention:
        - Implement time delays for governance actions
        - Use quadratic voting or other resistant mechanisms
        - Establish emergency pause mechanisms
      `,
      author: 'DeFi Research Team',
      date: '2024-01-01',
      readTime: '10 min read',
      category: 'DeFi',
      tags: ['DeFi', 'Security', 'Governance', 'MEV'],
      views: 1120,
      featured: true
    }
  ]

  const categories = ['All', 'Security', 'Solidity', 'Move', 'Solana', 'DeFi']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Security <span className="text-primary-200">Insights</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                Deep dive into DeFi security research, vulnerability analysis, and best practices from the Taichi Audit team.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Categories */}
            <div className="flex flex-wrap gap-4 mb-12 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-6 py-3 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Featured Posts */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {blogPosts.filter(post => post.featured).slice(0, 2).map((post) => (
                  <article key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <div className="p-8">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                          <Eye className="w-4 h-4 mr-1" />
                          {post.views}
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {post.author}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {post.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.readTime}
                          </div>
                        </div>
                        <button className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* All Posts */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">All Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <article key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                          <Eye className="w-4 h-4 mr-1" />
                          {post.views}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {post.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
} 