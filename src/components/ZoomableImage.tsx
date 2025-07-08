/**
 * ZoomableImage Component
 * 
 * A responsive image component with click-to-zoom functionality for blog posts.
 * 
 * Features:
 * - Dynamic sizing based on actual image dimensions
 * - Responsive design with max-width/height constraints
 * - Click-to-zoom with full-screen overlay
 * - Keyboard support (ESC to close)
 * - Loading state with skeleton
 * - Proper aspect ratio preservation
 * - Hover effects and zoom hint
 * - Caption support
 * 
 * Usage:
 * - Automatically used by MarkdownRenderer for all images
 * - Can be used directly: <ZoomableImage src="/path/to/image.jpg" alt="Description" />
 * 
 * Responsive behavior:
 * - Max width: 800px
 * - Max height: 600px
 * - Maintains aspect ratio
 * - Scales down on mobile devices
 * 
 * @author Taichi Audit Group
 */

'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

interface ZoomableImageProps {
  src: string
  alt: string
  title?: string
  className?: string
}

export default function ZoomableImage({ src, alt, title, className = '' }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Get image dimensions
    const img = new window.Image()
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
      setIsLoaded(true)
    }
    img.src = src
  }, [src])

  useEffect(() => {
    // Prevent scrolling when zoomed
    if (isZoomed) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isZoomed])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsZoomed(false)
    }
  }

  useEffect(() => {
    if (isZoomed) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isZoomed])

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className={`my-8 ${className}`}>
        <div 
          className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"
          style={{ 
            width: '100%', 
            height: '300px',
            maxWidth: '800px'
          }}
        />
      </div>
    )
  }

  // Calculate responsive container dimensions
  const maxWidth = 800 // Max width in pixels
  const aspectRatio = dimensions.width / dimensions.height || 16/9
  
  let containerWidth = Math.min(dimensions.width, maxWidth)
  let containerHeight = containerWidth / aspectRatio

  // For very tall images, limit height and adjust width
  const maxHeight = 600
  if (containerHeight > maxHeight) {
    containerHeight = maxHeight
    containerWidth = containerHeight * aspectRatio
  }

  return (
    <>
      <div className={`my-8 ${className}`} suppressHydrationWarning>
        {/* Main image container */}
        <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
          {isLoaded ? (
            <div 
              className="relative mx-auto rounded-lg overflow-hidden"
              style={{ 
                width: `${containerWidth}px`, 
                height: `${containerHeight}px`,
                maxWidth: '100%'
              }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                priority={false}
              />
              
              {/* Zoom overlay hint - only show on hover */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ZoomIn className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
          ) : (
            // Loading skeleton
            <div 
              className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"
              style={{ 
                width: '100%', 
                height: '300px',
                maxWidth: `${maxWidth}px`
              }}
            />
          )}
        </div>

        {/* Caption */}
        {alt && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3 italic max-w-3xl mx-auto">
            {alt}
          </p>
        )}
      </div>

      {/* Zoomed overlay */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-60 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Zoomed image */}
          <div className="relative max-w-full max-h-full">
            <Image
              src={src}
              alt={alt}
              width={dimensions.width}
              height={dimensions.height}
              className="max-w-full max-h-full object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
            Press <kbd className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">ESC</kbd> or click outside to close
          </div>
        </div>
      )}
    </>
  )
} 