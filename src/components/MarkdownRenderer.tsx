'use client'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity'
import rust from 'react-syntax-highlighter/dist/cjs/languages/prism/rust'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'
import { ghcolors, vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import ZoomableImage from './ZoomableImage'
import MetaMorphoQueueAnimation from './MetaMorphoQueueAnimation'

// Register only the languages used in blog posts
SyntaxHighlighter.registerLanguage('solidity', solidity)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('json', json)

// Import KaTeX CSS
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface CodeProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

interface ImageProps {
  src?: string
  alt?: string
  title?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDarkMode(root.classList.contains('dark'))

    update()

    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return (
    <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // Custom code block renderer
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (!inline && language) {
              // Clean up the code content more aggressively
              const codeContent = String(children)
                .split('\n')                                    // Split into lines
                .map(line => line.replace(/\s+$/, ''))          // Remove trailing spaces from each line
                .filter((line, index, array) => {              // Remove unnecessary blank lines
                  // Keep the line if it's not empty
                  if (line.trim() !== '') return true;
                  
                  // For empty lines, only keep if:
                  // - It's not at the start or end
                  // - The previous and next lines are not also empty
                  const prevLine = array[index - 1];
                  const nextLine = array[index + 1];
                  
                  return index > 0 && 
                         index < array.length - 1 && 
                         prevLine && prevLine.trim() !== '' && 
                         nextLine && nextLine.trim() !== '';
                })
                .join('\n')
                .replace(/^\n+/, '')                            // Remove leading newlines
                .replace(/\n+$/, '');                           // Remove trailing newlines
              
              return (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={isDarkMode ? vscDarkPlus : ghcolors}
                    language={language}
                    PreTag="pre"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      border: 'none',
                      outline: 'none',
                      textDecoration: 'none',
                      backgroundImage: 'none',
                      boxShadow: 'none',
                    }}
                    codeTagProps={{
                      style: {
                        textDecoration: 'none',
                        border: 'none',
                        outline: 'none',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                      }
                    }}
                    {...props}
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                </div>
              )
            }
            
            return (
              <code 
                className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          
          // Custom image renderer with Next.js Image
          img({ src, alt, title }: ImageProps) {
            if (!src) return null
            
            // Return the ZoomableImage component directly
            // The paragraph renderer will handle wrapping appropriately
            return (
              <ZoomableImage
                src={src}
                alt={alt || ''}
                title={title}
              />
            )
          },
          
          // Custom heading renderer with anchor links
          h1({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return (
              <h1 id={id} className="scroll-mt-16 group" {...props}>
                <a href={`#${id}`} className="no-underline">
                  {children}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">#</span>
                </a>
              </h1>
            )
          },
          
          h2({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return (
              <h2 id={id} className="scroll-mt-16 group" {...props}>
                <a href={`#${id}`} className="no-underline">
                  {children}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">#</span>
                </a>
              </h2>
            )
          },
          
          h3({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return (
              <h3 id={id} className="scroll-mt-16 group" {...props}>
                <a href={`#${id}`} className="no-underline">
                  {children}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">#</span>
                </a>
              </h3>
            )
          },
          
          // Custom blockquote renderer
          blockquote({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) {
            return (
              <blockquote 
                className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 my-4 italic"
                {...props}
              >
                {children}
              </blockquote>
            )
          },
          
          // Custom table renderer
          table({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border border-gray-300 dark:border-gray-700" {...props}>
                  {children}
                </table>
              </div>
            )
          },
          
          // Custom paragraph renderer to handle images properly
          p({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) {
            // Check if children contains an img element or a block-level custom component
            const childrenArray = React.Children.toArray(children)
            const hasBlockElement = childrenArray.some((child: any) => {
              if (typeof child === 'object' && child !== null) {
                // Check if it's an img element or our ZoomableImage component
                if (child.type === 'img' || (child.props && child.props.src !== undefined)) {
                  return true
                }

                // Check if it's our custom animation component
                if (child.type === MetaMorphoQueueAnimation) {
                  return true
                }
              }
              return false
            })

            // If paragraph contains a block element, render as div to avoid invalid HTML
            if (hasBlockElement) {
              return <div className="my-4" {...props}>{children}</div>
            }

            // Normal paragraph
            return <p {...props}>{children}</p>
          },
          
          // Custom animation embeds
          'metamorpho-queue-animation'() {
            return <MetaMorphoQueueAnimation />
          },

          // Custom link renderer
          a({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) {
            // External links
            if (href?.startsWith('http')) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  {...props}
                >
                  {children}
                </a>
              )
            }
            
            // Internal links
            return (
              <a
                href={href}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                {...props}
              >
                {children}
              </a>
            )
          },
        } as any}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Custom prose styles for better typography
export const proseStyles = `
  .prose h1 { @apply text-3xl md:text-4xl font-bold mb-6 mt-8 }
  .prose h2 { @apply text-2xl md:text-3xl font-semibold mb-4 mt-6 }
  .prose h3 { @apply text-xl md:text-2xl font-semibold mb-3 mt-5 }
  .prose h4 { @apply text-lg md:text-xl font-semibold mb-2 mt-4 }
  .prose p { @apply mb-4 leading-relaxed }
  .prose ul { @apply mb-4 space-y-2 }
  .prose ol { @apply mb-4 space-y-2 }
  .prose li { @apply leading-relaxed }
  .prose strong { @apply font-semibold }
  .prose em { @apply italic }
  .prose hr { @apply my-8 border-gray-300 dark:border-gray-700 }
  
  /* Code styles */
  .prose pre { @apply my-6 }
  .prose code { @apply text-sm }
  
  /* Math styles */
  .prose .katex-display { @apply my-6 text-center }
  .prose .katex { @apply text-base }
  
  /* Table styles */
  .prose th { @apply bg-gray-50 dark:bg-gray-800 font-semibold p-3 text-left }
  .prose td { @apply p-3 border-t border-gray-300 dark:border-gray-700 }
` 