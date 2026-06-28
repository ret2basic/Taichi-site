import React from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import BlogClientComponent from '@/components/BlogClientComponent'
import { getAllPosts, getAllCategories } from '@/lib/blog'

// This is a server component that fetches data at build time
export default async function BlogPage() {
  // Get blog data from the file system (server-side only)
  const allPosts = getAllPosts()
  const categories = ['All', ...getAllCategories()]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090e19] text-gray-900 dark:text-white">
      <Navigation />

      <main className="pt-20">
        <section className="relative py-20 bg-gray-50 dark:bg-[#090e19] overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Research</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight text-gray-950 dark:text-white">
                Source-level notes for protocol engineers and security reviewers.
              </h1>
              <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                We publish the kind of analysis we use during audits: protocol internals,
                exploit root causes, Solana account behavior, cryptography pitfalls, and DeFi math.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlogClientComponent allPosts={allPosts} categories={categories} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
