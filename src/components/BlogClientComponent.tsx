'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/utils'

interface BlogClientComponentProps {
  allPosts: BlogPost[]
  categories: string[]
}

export default function BlogClientComponent({ allPosts, categories }: BlogClientComponentProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Filter posts by selected category
  const filteredPosts = selectedCategory === 'All' 
    ? allPosts 
    : allPosts.filter(post => post.category === selectedCategory)
  const morphoInternals = allPosts.filter(post => post.slug.startsWith('morpho-internals'))
  const morphoLead = morphoInternals.find(post => /part\s*1/i.test(post.title)) || morphoInternals[0]
  const solanaSeries = allPosts.filter(post => post.slug.startsWith('solana-security-series'))
  const solanaLead = solanaSeries.find(post => /series-1$/i.test(post.slug)) || solanaSeries[0]

  return (
    <>
      {/* Categories */}
      <div className="flex flex-wrap gap-3 mb-12 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Internals Showcase */}
      <div className="mb-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <Link href="/morpho" className="group block w-full">
            <div className="relative w-full pt-[100%] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-600 via-slate-900 to-primary-800">
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_50%_75%,rgba(255,255,255,0.1),transparent_40%)]" />
              <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] font-semibold">
                  <span className="text-primary-50/80">Internals Series</span>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-semibold leading-tight mb-3">Morpho source code walkthroughs</p>
                  <p className="text-lg text-primary-50/80 max-w-xl">Purpose-built notes for DeFi engineers: annotated flows, risk handoffs, and math behind Morpho Blue.</p>
                </div>
                <div className="flex items-center justify-between text-sm text-primary-50">
                  <span>{morphoInternals.length} parts live • Morpho Blue</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Internals series</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">A deep-dive into the Morpho codebase. This is a line-by-line level walkthrough that you rarely find elsewhere.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/morpho" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors">
                View the series
                <ArrowRight className="w-4 h-4" />
              </Link>
              {morphoLead && (
                <Link href={`/blog/${morphoLead.slug}`} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Start at Part 1
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">Pendle Internals • coming soon</span>
              <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">Balancer V2 Internals • coming soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solana Security Showcase */}
      <div className="mb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <Link href="/solana-security" className="group block w-full">
            <div className="relative w-full pt-[100%] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-500 via-slate-900 to-cyan-600">
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.1),transparent_40%)]" />
              <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] font-semibold">
                  <span className="text-emerald-50/80">Security Series</span>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-semibold leading-tight mb-3">Solana security series</p>
                  <p className="text-lg text-emerald-50/80 max-w-xl">Reviewer-grade walkthroughs of account creation, token program internals, and real exploit patterns.</p>
                </div>
                <div className="flex items-center justify-between text-sm text-emerald-50">
                  <span>{solanaSeries.length} parts live • Token + System Programs</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Solana security series</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">A tactical series for protocol teams and security researchers mapping real Solana attack surfaces.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/solana-security" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors">
                View the series
                <ArrowRight className="w-4 h-4" />
              </Link>
              {solanaLead && (
                <Link href={`/blog/${solanaLead.slug}`} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Start at Part 1
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">Account creation + PDAs</span>
              <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">Token programs + ATA</span>
              <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">DoS + extension edges</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Posts */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
          <span className="text-lg font-normal text-gray-400 dark:text-slate-500 ml-2">
            ({filteredPosts.length})
          </span>
        </h2>
        
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-slate-500">No articles found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden hover:border-gray-300 dark:hover:border-slate-700 transition-colors duration-200 h-full">
                  {post.image && (
                    <div className="relative h-48 bg-gray-100 dark:bg-slate-800">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="inline-flex items-center bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-lg text-xs font-medium">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category}
                      </span>
                      {post.featured && (
                        <span className="bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 px-2 py-1 rounded-lg text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-1 rounded text-xs">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mt-auto">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDate(post.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 