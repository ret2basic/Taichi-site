import { BookOpen, Sparkles } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'
import SeriesPageLayout, { type SeriesChapter } from '@/components/SeriesPageLayout'

function extractPartNumber(title: string): number {
  const match = title.match(/Part\s*(\d+)/i)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export default function MorphoPage() {
  const morphoPosts = getAllPosts().filter((post) => post.slug.startsWith('morpho-internals'))

  const chapters: SeriesChapter[] = morphoPosts
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      readTime: post.readTime,
      partNumber: extractPartNumber(post.title),
    }))
    .sort((a, b) => a.partNumber - b.partNumber)

  const upcomingSeries = [
    {
      title: 'Pendle Internals',
      status: 'Queued',
      description: 'Yield routing primitives, hooks, and how points and curves interact with risk.',
    },
    {
      title: 'Balancer V2 Internals',
      status: 'Queued',
      description: 'Vault accounting, pool math, and MEV-aware design choices for LP health.',
    },
  ]

  return (
    <SeriesPageLayout
      badgeIcon={<BookOpen className="w-4 h-4" />}
      badgeLabel="Source code walkthrough"
      title="Morpho Internals Series"
      subtitle="A deep-dive into the Morpho codebase. This is a line-by-line level walkthrough that you rarely find elsewhere."
      heroGradient="bg-[radial-gradient(circle_at_18%_25%,rgba(14,165,233,0.25),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(217,70,239,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.35),transparent_45%)]"
      chapters={chapters}
      chaptersHeading="Read the series like a book"
      emptyText="The Morpho Internals chapters will appear here as soon as they are published."
      bottomSection={
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Next up</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">More Internals series on deck</h2>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200">
              <Sparkles className="w-4 h-4 text-secondary-500" />
              Fresh drops will reuse this hub
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSeries.map((series) => (
              <div key={series.title} className="rounded-2xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{series.title}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-800 dark:bg-secondary-900/40 dark:text-secondary-200">{series.status}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{series.description}</p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  )
}
