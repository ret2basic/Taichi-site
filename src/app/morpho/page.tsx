import Link from 'next/link'
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getAllPosts } from '@/lib/blog'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function extractPartNumber(title: string): number {
  const match = title.match(/Part\s*(\d+)/i)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export default function MorphoPage() {
  const morphoPosts = getAllPosts().filter((post) => post.slug.startsWith('morpho-internals'))

  const latestUpdate = morphoPosts.reduce<string | null>((latest, post) => {
    if (!latest) return post.date
    return new Date(post.date) > new Date(latest) ? post.date : latest
  }, null)
  const latestUpdateLabel = latestUpdate ? formatDate(latestUpdate) : 'soon'

  const chapters = morphoPosts
    .map((post) => ({
      ...post,
      partNumber: extractPartNumber(post.title),
    }))
    .sort((a, b) => a.partNumber - b.partNumber)

  const startSlug = chapters[0]?.slug ? `/blog/${chapters[0].slug}` : '/blog'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />

      <main className="pt-20">
        <section className="relative overflow-hidden py-16 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(14,165,233,0.25),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(217,70,239,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.35),transparent_45%)]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-900 bg-primary-100/70 border border-primary-200 px-4 py-2 rounded-full w-fit dark:text-primary-50 dark:bg-slate-800 dark:border-slate-700">
                <BookOpen className="w-4 h-4" />
                Source code walkthrough
              </div>
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Morpho Internals Series</h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200">A deep-dive into the Morpho codebase. This is a line-by-line level walkthrough that you rarely find elsewhere.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={startSlug} className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white font-semibold shadow-md hover:bg-primary-700 transition-colors">
                  Start at Part {chapters[0]?.partNumber ?? 1}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#chapters" className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 font-semibold hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                  Browse chapters
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="chapters" className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Morpho Internals</p>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Read the series like a book</h2>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200">
                <Sparkles className="w-4 h-4 text-primary-500" />
                Latest update {latestUpdateLabel}
              </span>
            </div>

            {chapters.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-center">
                The Morpho Internals chapters will appear here as soon as they are published.
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <Link key={chapter.slug} href={`/blog/${chapter.slug}`} className="group block">
                    <article className="flex gap-5 items-start rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-xl transition-all duration-200">
                      <div className="flex flex-col items-center pt-1">
                        <span className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 font-bold flex items-center justify-center">
                          {Number.isFinite(chapter.partNumber) && chapter.partNumber !== Number.MAX_SAFE_INTEGER ? `0${chapter.partNumber}`.slice(-2) : '•'}
                        </span>
                        <span className="mt-2 w-px flex-1 bg-gradient-to-b from-primary-200 via-primary-200/0 to-transparent dark:from-primary-900/50" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 items-center">
                          <span className="font-semibold text-primary-700 dark:text-primary-200">Part {Number.isFinite(chapter.partNumber) && chapter.partNumber !== Number.MAX_SAFE_INTEGER ? chapter.partNumber : '—'}</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(chapter.date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {chapter.readTime}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                          {chapter.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{chapter.excerpt}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-300 group-hover:translate-x-1 transition-transform" />
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
        </section>
      </main>

      <Footer />
    </div>
  )
}
