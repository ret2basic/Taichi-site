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
        {/* Hero Section */}
        <section className="relative py-20 bg-gray-50 dark:bg-[#090e19] overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-500/10 rounded-full blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">Blog</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                Security Insights
              </h1>
              <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
                Deep dive into DeFi security research, vulnerability analysis, and best practices from the Taichi Audit team.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Content */}
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