import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  featured: boolean
  image?: string
  content: string
}

const postsDirectory = path.join(process.cwd(), 'content/blog')

export function getAllPosts(): BlogPost[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    const allPosts = fileNames
      .filter(name => name.endsWith('.md'))
      .map(name => {
        const slug = name.replace(/\.md$/, '')
        return getPostBySlug(slug)
      })
      .filter(post => post !== null) as BlogPost[]

    // Sort posts by date (newest first)
    return allPosts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch (error) {
    console.error('Error reading blog posts:', error)
    return []
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      author: data.author || 'Anonymous',
      date: data.date || new Date().toISOString().split('T')[0],
      readTime: data.readTime || '5 min read',
      category: data.category || 'General',
      tags: data.tags || [],
      featured: data.featured || false,
      image: data.image,
      content,
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
}

export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter(post => post.featured)
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  )
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  )
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const categories = Array.from(new Set(posts.map(post => post.category)))
  return categories.sort()
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = Array.from(new Set(posts.flatMap(post => post.tags)))
  return tags.sort()
}



export function getRelatedPosts(currentPost: BlogPost, limit: number = 3): BlogPost[] {
  const allPosts = getAllPosts().filter(post => post.slug !== currentPost.slug)
  
  // Score posts based on shared tags and category
  const scoredPosts = allPosts.map(post => {
    let score = 0
    
    // Same category gets +2 points
    if (post.category === currentPost.category) {
      score += 2
    }
    
    // Each shared tag gets +1 point
    const sharedTags = post.tags.filter(tag => 
      currentPost.tags.includes(tag)
    ).length
    score += sharedTags
    
    return { post, score }
  })
  
  // Sort by score and return top posts
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post)
}

// ─── Series helpers ──────────────────────────────────────────────

/** Known series definitions: slug prefix → part-number extractor */
const SERIES_DEFS: { prefix: string; partNumber: (slug: string, title: string) => number }[] = [
  {
    prefix: 'morpho-internals',
    partNumber: (_slug, title) => {
      const m = title.match(/Part\s*(\d+)/i)
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
    },
  },
  {
    prefix: 'solana-security-series',
    partNumber: (slug) => {
      const m = slug.match(/solana-security-series-(\d+)/i)
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
    },
  },
]

export interface SeriesNav {
  seriesName: string
  seriesHubUrl: string
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
  currentPart: number
  totalParts: number
}

/**
 * If `post` belongs to a known series, returns prev/next navigation info.
 * Returns null for standalone (non-series) posts.
 */
export function getSeriesNav(post: BlogPost): SeriesNav | null {
  const def = SERIES_DEFS.find((d) => post.slug.startsWith(d.prefix))
  if (!def) return null

  const allPosts = getAllPosts().filter((p) => p.slug.startsWith(def.prefix))
  const sorted = allPosts
    .map((p) => ({ ...p, _part: def.partNumber(p.slug, p.title) }))
    .sort((a, b) => a._part - b._part)

  const idx = sorted.findIndex((p) => p.slug === post.slug)
  if (idx === -1) return null

  const seriesName = def.prefix === 'morpho-internals' ? 'Morpho Internals' : 'Solana Security'
  const seriesHubUrl = def.prefix === 'morpho-internals' ? '/morpho' : '/solana-security'

  return {
    seriesName,
    seriesHubUrl,
    prev: idx > 0 ? { slug: sorted[idx - 1].slug, title: sorted[idx - 1].title } : null,
    next: idx < sorted.length - 1 ? { slug: sorted[idx + 1].slug, title: sorted[idx + 1].title } : null,
    currentPart: idx + 1,
    totalParts: sorted.length,
  }
}