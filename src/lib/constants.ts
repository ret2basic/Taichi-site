/**
 * Single source of truth for all stats, links, and content that appears
 * across multiple components (Hero, Stats, About, WhyChooseUs, Footer, etc.).
 *
 * Update numbers here once → every page picks up the change.
 */

// ─── External links ───────────────────────────────────────────────
export const AUDIT_REQUEST_URL =
  'https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform?pli=1&ts=670e18d0&pli=1&edit_requested=true'

export const PORTFOLIO_URL = 'https://github.com/TaiChiAuditGroup/Portfolio'
export const WRITEUPS_URL = 'https://ret2basic.gitbook.io/ctfwriteup'
export const GITHUB_URL = 'https://github.com/TaiChiAuditGroup'
export const TWITTER_URL = 'https://x.com/taichiaudit'
export const TELEGRAM_URL = 'https://t.me/+egUmC7vd9TI4MGM9'
export const EMAIL = 'taichiweb3sec@gmail.com'
export const LLM4SEC_URL = 'https://llm4sec.net/'
export const DEFIHACKLABS_URL = 'https://defihacklabs.io/'

// ─── Key stats ────────────────────────────────────────────────────
export const STATS = {
  competitions: '60+',
  contestTop3: '11',
  contestTop3Label: '11 times',
  firstPlaceWins: '6',
  totalFindings: '170+',
  hmFindings: '300+',
  highFindings: '60+',
  mediumFindings: '75+',
  auditorsPerProject: '≥2',
  remedyCTF2025: '#7',
} as const

// ─── Featured contest wins ───────────────────────────────────────
export const FEATURED_WINS = [
  { name: 'ZKsync Era', type: 'L2 Scaling Solution' },
  { name: 'Maia DAO', type: 'DeFi Governance' },
  { name: 'Arbitrum BoLD', type: 'Dispute Resolution' },
  { name: 'Arcadexyz', type: 'NFT Gaming Platform' },
  { name: 'Coinbase SpendPermission', type: 'Account Abstraction' },
  { name: 'OneWorld', type: 'DeFi Platform' },
] as const

// ─── Achievements (used in StatsSection) ─────────────────────────
export const ACHIEVEMENTS = [
  {
    platform: 'Audit contests',
    description: `${STATS.contestTop3Label} Top 3 wins including ${STATS.firstPlaceWins} first places. Recent wins: OneWorld #1, Coinbase SpendPermission #1, Arbitrum BoLD #1.`,
  },
  {
    platform: 'Web3 CTFs',
    description: `Remedy CTF 2025 ${STATS.remedyCTF2025}, Blaz CTF 2024 #4, OpenZeppelin Ethernaut CTF 2024 #9, Secureum RACEs multiple Top 3 wins.`,
  },
  {
    platform: 'Our specialization',
    description:
      'We enjoy finding bugs in Solidity, Move, and Solana codebases. Anything DeFi is welcome.',
  },
  {
    platform: 'Our philosophy',
    description:
      'We believe that the best way to demonstrate security expertise is to participate in audit contests and CTFs. No public record, no skills.',
  },
] as const
