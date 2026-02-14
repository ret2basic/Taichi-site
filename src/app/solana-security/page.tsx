import Link from 'next/link'
import { ArrowRight, BookOpen, Shield } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'
import SeriesPageLayout, { type SeriesChapter } from '@/components/SeriesPageLayout'

function extractSeriesNumber(slug: string): number {
  const match = slug.match(/solana-security-series-(\d+)/i)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export default function SolanaSecuritySeriesPage() {
  const solanaPosts = getAllPosts().filter((post) => post.slug.startsWith('solana-security-series'))

  const chapters: SeriesChapter[] = solanaPosts
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      readTime: post.readTime,
      partNumber: extractSeriesNumber(post.slug),
    }))
    .sort((a, b) => a.partNumber - b.partNumber)

  const focusAreas = [
    {
      title: 'Protocol-level exploit patterns',
      description: 'Reproducible attack surfaces across System, Token, and ATA flows.',
    },
    {
      title: 'Account layout + initialization',
      description: 'SPL vs Token2022 data layout, extension semantics, and init invariants.',
    },
    {
      title: 'Reviewer-grade traces',
      description: 'Instruction-by-instruction walks aligned with on-chain logs.',
    },
  ]

  return (
    <SeriesPageLayout
      badgeIcon={<Shield className="w-4 h-4" />}
      badgeLabel="Solana security series"
      title="Solana Security Series"
      subtitle="A reviewer-focused walkthrough of real Solana security patterns, from account creation pitfalls to Token2022 extension semantics."
      heroGradient="bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(20,184,166,0.22),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(15,23,42,0.35),transparent_45%)]"
      chapters={chapters}
      chaptersHeading="Read the series like a playbook"
      emptyText="The Solana Security chapters will appear here as soon as they are published."
      bottomSection={
        <>
          {/* Focus areas */}
          <div className="space-y-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Series focus</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Security-research ready</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {focusAreas.map((area) => (
                <div key={area.title} className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{area.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{area.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Research cadence */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                <BookOpen className="w-4 h-4" />
                Research cadence
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">New Solana security drops are queued</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Expect future chapters on consensus-edge cases, token program extensions, and protocol-specific attack surfaces.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 font-semibold hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            >
              Browse all posts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      }
    />
  )
}
