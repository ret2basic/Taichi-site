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

        {/* Newsletter CTA */}
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with Security Insights
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get the latest DeFi security research and vulnerability analysis delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
} 