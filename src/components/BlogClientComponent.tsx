'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowRight, Tag } from 'lucide-react'
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
  
  const featuredPosts = allPosts.filter(post => post.featured)

  return (
    <>
      {/* Categories */}
      <div className="flex flex-wrap gap-4 mb-12 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-full border transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-slate-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Featured Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.slice(0, 2).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                  {post.image && (
                    <div className="relative h-48 bg-white dark:bg-gray-900">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
                          {formatDate(post.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                      <div className="flex items-center text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Posts */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({filteredPosts.length})
          </span>
        </h2>
        
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No articles found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 h-full">
                  {post.image && (
                    <div className="relative h-48 bg-white dark:bg-gray-900">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="inline-flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.category}
                      </span>
                      {post.featured && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(post.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
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