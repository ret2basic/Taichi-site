import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import type { SeriesNav } from '@/lib/blog'

export default function SeriesNavigation({ nav }: { nav: SeriesNav }) {
  return (
    <div className="mt-12 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
      {/* Series header */}
      <div className="flex items-center justify-between">
        <Link
          href={nav.seriesHubUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          <BookOpen className="w-4 h-4" />
          {nav.seriesName} Series
        </Link>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Part {nav.currentPart} of {nav.totalParts}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${(nav.currentPart / nav.totalParts) * 100}%` }}
        />
      </div>

      {/* Prev / Next */}
      <div className="flex items-stretch gap-4">
        {nav.prev ? (
          <Link
            href={`/blog/${nav.prev.slug}`}
            className="flex-1 group flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mt-0.5 shrink-0 text-gray-400 group-hover:text-primary-500 transition-colors" />
            <div className="min-w-0">
              <span className="block text-xs text-gray-500 dark:text-gray-400">Previous</span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {nav.prev.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nav.next ? (
          <Link
            href={`/blog/${nav.next.slug}`}
            className="flex-1 group flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:border-primary-400 dark:hover:border-primary-500 transition-colors text-right"
          >
            <div className="flex-1 min-w-0">
              <span className="block text-xs text-gray-500 dark:text-gray-400">Next</span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {nav.next.title}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 mt-0.5 shrink-0 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
