import React from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Boxes, Code2, FileSearch, GitBranch, ShieldCheck, Workflow } from 'lucide-react'
import { AUDIT_REQUEST_URL } from '@/lib/constants'

const auditScopes = [
  {
    title: 'Smart contract systems',
    description: 'Solidity, Move, Solana, CosmWasm, and Cairo codebases across DeFi protocols, vaults, bridges, and upgradeable systems.',
  },
  {
    title: 'ZK integrations',
    description: 'Verifier integrations, proof-dependent state transitions, circuit assumptions, trusted setup boundaries, and on-chain validation logic.',
  },
  {
    title: 'Web2-Web3 products',
    description: 'Exchange frontends, backend services, wallet flows, signing boundaries, API assumptions, and off-chain systems that touch user assets.',
  },
  {
    title: 'Integration risk',
    description: 'Adapters, wrappers, callbacks, ERC4626/ERC3525-style accounting, cross-protocol assumptions, and edge-case liquidity flows.',
  },
]

const reviewSteps = [
  {
    icon: FileSearch,
    title: 'Map the protocol',
    description: 'We start from assets, trust boundaries, user flows, and economic invariants instead of only reading files top to bottom.',
  },
  {
    icon: GitBranch,
    title: 'Trace dangerous paths',
    description: 'Accounting updates, callbacks, liquidation branches, oracle reads, CPI boundaries, and privileged operations get explicit paths.',
  },
  {
    icon: ShieldCheck,
    title: 'Review with 2+ researchers',
    description: 'At least two auditors review each engagement, with focus split by subsystem and vulnerability class.',
  },
  {
    icon: Workflow,
    title: 'Verify fixes',
    description: 'Findings are delivered with impact, root cause, and remediation notes; patched code receives a focused follow-up pass.',
  },
]

const researchLinks = [
  {
    href: '/morpho',
    title: 'Morpho Internals',
    description: 'A source-level lending protocol walkthrough: markets, IRMs, oracles, vaults, and integration security.',
    meta: '5-part DeFi series',
  },
  {
    href: '/solana-security',
    title: 'Solana Security',
    description: 'Reviewer-grade notes on account creation, Anchor behavior, CPI reloads, Token2022, and DoS patterns.',
    meta: '4-part Solana series',
  },
  {
    href: '/blog/solv-protocol-hack-analysis-march-2026',
    title: 'Solv Hack Analysis',
    description: 'Callback-driven double minting in an ERC-3525 wrapper, explained from source to exploit mechanics.',
    meta: 'Incident analysis',
  },
]

export default function StatsSection() {
  return (
    <section id="portfolio" className="bg-white py-24 dark:bg-[#0b1120]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-end mb-14">
          <div>
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Audit Focus</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              Built for protocols where bugs hide in accounting and integration edges.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-slate-300">
            We are most useful on systems with non-trivial state transitions: markets, vaults,
            callbacks, cross-program calls, proof verification, exchange logic, wallet flows, or
            protocol-specific math that needs source-level review.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-slate-800 dark:bg-slate-800 md:grid-cols-2">
          {auditScopes.map((scope) => (
            <div key={scope.title} className="bg-white p-6 dark:bg-slate-900/70">
              <Boxes className="mb-5 h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-950 dark:text-white">{scope.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{scope.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[0.86fr,1.14fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Review Model</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              A practical audit flow, not a feature checklist.
            </h2>
            <p className="mt-5 text-gray-600 dark:text-slate-300 leading-relaxed">
              The process is intentionally simple: understand the protocol, trace the dangerous paths,
              review them with at least two researchers, then verify the fixes. Fix review is included
              by default in every audit engagement.
            </p>
            <a
              href={AUDIT_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500"
            >
              Scope an audit
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviewSteps.map((step) => (
              <div key={step.title} className="border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-[#090e19] rounded-lg">
                <step.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h3 className="mt-4 text-base font-semibold text-gray-950 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Research</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
                Our public writing shows how we review code.
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View all research
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {researchLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-primary-700"
              >
                <div>
                  <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase text-gray-400 dark:text-slate-500">
                    <BookOpen className="h-4 w-4" />
                    {item.meta}
                  </div>
                  <h3 className="text-xl font-bold text-gray-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{item.description}</p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
                  Read
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-slate-800 dark:bg-[#090e19] md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <Code2 className="mb-4 h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Have a codebase ready for review?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              Send scope, repository access model, target dates, and the protocols you integrate with.
              We will respond with availability and a review plan.
            </p>
          </div>
          <a
            href={AUDIT_REQUEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500 md:mt-0"
          >
            Request Audit
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
