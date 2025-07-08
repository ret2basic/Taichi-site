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
            <BlogClientComponent allPosts={allPosts} categories={categories} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
} 