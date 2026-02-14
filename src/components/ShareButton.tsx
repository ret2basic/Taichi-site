'use client'
import React, { useState } from 'react'
import { Share2, Check, Link2, Twitter } from 'lucide-react'
import { TWITTER_URL } from '@/lib/constants'

interface ShareButtonProps {
  title: string
  slug: string
}

export default function ShareButton({ title, slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : `https://taichiaudit.com/blog/${slug}`

  const handleShare = async () => {
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Last resort
      window.prompt('Copy this link:', url)
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=taichiaudit`

  return (
    <div className="flex items-center space-x-3">
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
      >
        <Twitter className="w-4 h-4 mr-2" />
        Tweet
      </a>
      <button
        onClick={handleShare}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4 mr-2" />
            Copy Link
          </>
        )}
      </button>
    </div>
  )
}
