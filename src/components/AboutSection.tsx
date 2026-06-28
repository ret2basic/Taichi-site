import React from 'react'
import Link from 'next/link'
import { ArrowRight, Brain, Code2, Eye, FileCheck2, ShieldCheck, Users } from 'lucide-react'
import { AUDIT_REQUEST_URL, DEFIHACKLABS_URL, LLM4SEC_URL, STATS } from '@/lib/constants'

const principles = [
  {
    icon: Users,
    title: 'Two or more reviewers',
    description: 'Every engagement is reviewed by at least two researchers. We split coverage by subsystem, risk class, and protocol flow.',
  },
  {
    icon: Eye,
    title: 'Past exploits as input',
    description: 'We study real incident mechanics and turn them into review prompts for callbacks, accounting, oracle use, and integration assumptions.',
  },
  {
    icon: Brain,
    title: 'Tool-assisted, not tool-led',
    description: 'LLM and static-analysis helpers are used to widen coverage and catch low-hanging issues; final judgment stays with human reviewers.',
  },
  {
    icon: FileCheck2,
    title: 'Fix review included',
    description: 'Fix review is included by default in every audit. Patched code receives a targeted follow-up so fixes do not introduce new edge cases.',
  },
]

const ecosystems = [
  { name: 'Solidity / EVM', detail: 'Protocols, vaults, lending markets, oracles, wrappers, bridges' },
  { name: 'Move', detail: 'Aptos and Sui resources, capabilities, package upgrades, object flows' },
  { name: 'Solana', detail: 'Anchor constraints, PDAs, CPI flows, token program behavior' },
  { name: 'CosmWasm', detail: 'Cosmos contracts, message routing, state machines, cross-chain assumptions' },
  { name: 'Cairo', detail: 'Starknet contracts, account flows, protocol integrations, storage logic' },
  { name: 'ZK integration', detail: 'Verifier wiring, proof-dependent state changes, circuit assumptions' },
  { name: 'Exchanges and wallets', detail: 'Frontends, backends, signing boundaries, API assumptions, custody-adjacent flows' },
  { name: 'Protocol math', detail: 'Accounting invariants, shares, liquidity, rounding, rate models' },
]

export default function AboutSection() {
  return (
    <section id="about" className="bg-white py-20 dark:bg-[#0b1120]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">About Taichi</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              A security research group shaped by contests, CTFs, and real exploit analysis.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-slate-300">
              Taichi Audit Group comes from the DeFiHackLabs orbit and focuses on high-signal
              review work across mainstream smart contract frameworks, ZK integrations, and
              Web2-Web3 systems such as exchanges and wallets. We use public competition performance
              and long-form research as evidence of how we reason about code.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-slate-800 dark:bg-slate-800">
              {[
                { value: STATS.competitions, label: 'Audit contests' },
                { value: STATS.firstPlaceWins, label: 'First-place wins' },
                { value: STATS.contestTop3Label, label: 'Top 3 results' },
                { value: STATS.hmFindings, label: 'H/M findings' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 p-5 dark:bg-[#090e19]">
                  <div className="text-2xl font-bold text-gray-950 dark:text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-slate-800 dark:bg-[#090e19]">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white">How we want to be evaluated</h3>
            <div className="mt-5 space-y-5">
              {[
                {
                  label: 'Public track record',
                  text: 'Contest and CTF results are easier to verify than broad marketing claims.',
                },
                {
                  label: 'Research depth',
                  text: 'Our Morpho and Solana series show source-level review, not just surface-level best practices.',
                },
                {
                  label: 'Exploit awareness',
                  text: 'DeFiHackLabs-style incident analysis keeps our review checklists grounded in bugs that have happened in production.',
                },
              ].map((item) => (
                <div key={item.label} className="border-l-2 border-primary-500 pl-4">
                  <h4 className="text-sm font-semibold text-gray-950 dark:text-white">{item.label}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Audit Principles</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              What stays consistent across engagements.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {principles.map((principle) => (
              <div key={principle.title} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/70">
                <principle.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1.08fr,0.92fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-3">Coverage</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950 dark:text-white">
              We are most useful where protocol-specific logic matters.
            </h2>
            <p className="mt-5 text-gray-600 dark:text-slate-300 leading-relaxed">
              The team is strongest on systems where correctness depends on state transitions,
              accounting invariants, proof verification, off-chain assumptions, and integration boundaries.
              That includes DeFi protocols, ZK integrations, exchange systems, wallet flows, and
              custody-adjacent Web2-Web3 surfaces.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={AUDIT_REQUEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-500"
              >
                Request Audit
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500"
              >
                Read Research
              </Link>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-slate-800 dark:bg-slate-800">
            {ecosystems.map((item) => (
              <div key={item.name} className="bg-gray-50 p-5 dark:bg-[#090e19]">
                <div className="flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-semibold text-gray-950 dark:text-white">{item.name}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-lg border border-gray-200 bg-gray-50 p-8 dark:border-slate-800 dark:bg-[#090e19]">
          <div className="grid gap-8 md:grid-cols-3">
            <a
              href={DEFIHACKLABS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Eye className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="mt-4 font-semibold text-gray-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                DeFiHackLabs context
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                Real exploit writeups inform the questions we ask during review.
              </p>
            </a>
            <a
              href={LLM4SEC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="mt-4 font-semibold text-gray-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                LLM4Sec tooling
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                Tooling helps widen coverage, but it does not replace manual reasoning.
              </p>
            </a>
            <Link href="/blog" className="group">
              <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="mt-4 font-semibold text-gray-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Public research
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                Long-form posts show our analysis style before an engagement starts.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
