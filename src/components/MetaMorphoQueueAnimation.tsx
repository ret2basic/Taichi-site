'use client'

import React from 'react'

type Step = {
  title: string
  description: string
  indexes: number[]
  seen: boolean[]
  newWithdrawQueue: string[]
  removalCandidate?: string
  checks?: Array<{ label: string; ok: boolean }>
  outcome?: string
  highlightLines: number[]
}

const codeLines = [
  'function updateWithdrawQueue(uint256[] calldata indexes) external',
  'onlyAllocatorRole {',
  '    uint256 newLength = indexes.length;',
  '    uint256 currLength = withdrawQueue.length;',
  '',
  '    bool[] memory seen = new bool[](currLength);',
  '    Id[] memory newWithdrawQueue = new Id[](newLength);',
  '',
  '    for (uint256 i; i < newLength; ++i) {',
  '        uint256 prevIndex = indexes[i];',
  '        Id id = withdrawQueue[prevIndex];',
  '        if (seen[prevIndex])',
  '            revert ErrorsLib.DuplicateMarket(id);',
  '        seen[prevIndex] = true;',
  '        newWithdrawQueue[i] = id;',
  '    }',
  '',
  '    for (uint256 i; i < currLength; ++i) {',
  '        if (!seen[i]) {',
  '            Id id = withdrawQueue[i];',
  '            if (config[id].cap != 0)',
  '                revert ErrorsLib.InvalidMarketRemovalNonZeroCap(id);',
  '            if (pendingCap[id].validAt != 0)',
  '                revert ErrorsLib.PendingCap(id);',
  '',
  '            if (MORPHO.supplyShares(id, address(this)) != 0 &&',
  '                config[id].removableAt == 0)',
  '                revert ErrorsLib.InvalidMarketRemovalNonZeroSupply(id);',
  '            if (MORPHO.supplyShares(id, address(this)) != 0 &&',
  '                block.timestamp < config[id].removableAt)',
  '                revert ErrorsLib.InvalidMarketRemovalTimelockNotElapsed(id);',
  '',
  '            delete config[id];',
  '        }',
  '    }',
  '',
  '    withdrawQueue = newWithdrawQueue;',
  '}',
]

const markets = [
  { id: 'A', cap: 100, supply: '>0', pendingCap: false, removableAt: null },
  { id: 'B', cap: 50, supply: '>0', pendingCap: false, removableAt: null },
  { id: 'C', cap: 0, supply: '0', pendingCap: false, removableAt: null },
  { id: 'D', cap: 0, supply: '>0', pendingCap: false, removableAt: 't0 + timelock' },
]

const steps: Step[] = [
  {
    title: 'Initial state',
    description: 'Withdraw queue is [A, B, C, D]. No pending caps. D already has removableAt set.',
    indexes: [],
    seen: [false, false, false, false],
    newWithdrawQueue: [],
    highlightLines: [],
  },
  {
    title: 'Case 1: build new queue',
    description: 'Call updateWithdrawQueue([0, 1, 3]) and rebuild the queue. C is omitted.',
    indexes: [0, 1, 3],
    seen: [true, true, false, true],
    newWithdrawQueue: ['A', 'B', 'D'],
    highlightLines: [9, 10, 11, 12, 13, 14, 15],
  },
  {
    title: 'Case 1: remove C',
    description: 'C is the only unseen entry. It has cap=0, no pending cap, and zero supply, so removal succeeds.',
    indexes: [0, 1, 3],
    seen: [true, true, false, true],
    newWithdrawQueue: ['A', 'B', 'D'],
    removalCandidate: 'C',
    checks: [
      { label: 'cap == 0', ok: true },
      { label: 'pendingCap == 0', ok: true },
      { label: 'supplyShares == 0', ok: true },
    ],
    outcome: 'delete config[C]',
    highlightLines: [18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31, 33],
  },
  {
    title: 'Case 2: build new queue',
    description: 'Call updateWithdrawQueue([0, 1, 2]) and omit D (still has supply).',
    indexes: [0, 1, 2],
    seen: [true, true, true, false],
    newWithdrawQueue: ['A', 'B', 'C'],
    highlightLines: [9, 10, 11, 12, 13, 14, 15],
  },
  {
    title: 'Case 2: timelock not elapsed',
    description: 'D is unseen and has supply. removableAt is set but timelock has not elapsed yet.',
    indexes: [0, 1, 2],
    seen: [true, true, true, false],
    newWithdrawQueue: ['A', 'B', 'C'],
    removalCandidate: 'D',
    checks: [
      { label: 'cap == 0', ok: true },
      { label: 'pendingCap == 0', ok: true },
      { label: 'supplyShares != 0', ok: true },
      { label: 'removableAt set', ok: true },
      { label: 'timelock elapsed', ok: false },
    ],
    outcome: 'revert InvalidMarketRemovalTimelockNotElapsed',
    highlightLines: [18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31],
  },
  {
    title: 'Case 2: timelock elapsed',
    description: 'Same call, but after the timelock. D can now be removed.',
    indexes: [0, 1, 2],
    seen: [true, true, true, false],
    newWithdrawQueue: ['A', 'B', 'C'],
    removalCandidate: 'D',
    checks: [
      { label: 'cap == 0', ok: true },
      { label: 'pendingCap == 0', ok: true },
      { label: 'supplyShares != 0', ok: true },
      { label: 'removableAt set', ok: true },
      { label: 'timelock elapsed', ok: true },
    ],
    outcome: 'delete config[D]',
    highlightLines: [18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31, 33],
  },
]

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {label}
    </span>
  )
}

function ArrayRow({ title, items, activeIndex }: { title: string; items: string[]; activeIndex?: number }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <div
            key={`${title}-${idx}`}
            className={`min-w-[44px] rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
              activeIndex === idx
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MetaMorphoQueueAnimation() {
  const [stepIndex, setStepIndex] = React.useState(0)
  const step = steps[stepIndex]

  const goPrev = () => setStepIndex((prev) => Math.max(prev - 1, 0))
  const goNext = () => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  const reset = () => setStepIndex(0)

  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          MetaMorpho updateWithdrawQueue walkthrough
        </div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 lg:col-span-2">
          <div className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Code (MetaMorpho.sol)
          </div>
          <div className="space-y-2">
            {codeLines.map((line, idx) => {
              const lineNumber = idx + 1
              const isActive = step.highlightLines.includes(lineNumber)
              return (
                <div
                  key={`${line}-${lineNumber}`}
                  className={`rounded-md px-3 py-1 ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="whitespace-pre text-sm font-mono">{line}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Queue state</div>
            <div className="space-y-4">
              <ArrayRow title="withdrawQueue" items={['A', 'B', 'C', 'D']} />
              {step.newWithdrawQueue.length > 0 && (
                <ArrayRow title="newWithdrawQueue" items={step.newWithdrawQueue} />
              )}
              {step.indexes.length > 0 && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  indexes: {step.indexes.join(', ')}
                </div>
              )}
              <div className="flex gap-2">
                {step.seen.map((flag, idx) => (
                  <Badge key={`seen-${idx}`} label={`seen[${idx}] = ${flag ? 'true' : 'false'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Market config</div>
            <div className="space-y-3">
              {markets.map((market) => {
                const isCandidate = market.id === step.removalCandidate
                return (
                  <div
                    key={market.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isCandidate
                        ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Market {market.id}</span>
                      <Badge label={`cap: ${market.cap}`} />
                      <Badge label={`supplyShares: ${market.supply}`} />
                      <Badge label={`pendingCap: ${market.pendingCap ? 'yes' : 'no'}`} />
                      <Badge label={`removableAt: ${market.removableAt ?? 'none'}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Checks</div>
            {step.checks ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {step.checks.map((check) => (
                  <div key={check.label} className="flex items-center justify-between">
                    <span>{check.label}</span>
                    <span className={check.ok ? 'text-emerald-600' : 'text-rose-600'}>
                      {check.ok ? 'pass' : 'fail'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-300">No checks in this step.</div>
            )}

            {step.outcome && (
              <div className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Outcome: {step.outcome}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Step {stepIndex + 1} of {steps.length}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200"
          >
            Next
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
