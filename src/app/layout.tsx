import type { Metadata } from 'next'
import Script from 'next/script'
import React from 'react'
import { Inter, Fira_Code } from 'next/font/google'
import './globals.css'
import { DarkModeProvider } from '../lib/DarkModeContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://taichiaudit.com'),
  title: 'Taichi Audit Group - DeFi Security Experts',
  description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews. Incubated from DeFiHackLabs community.',
  keywords: ['DeFi', 'audit', 'security', 'smart contracts', 'Solidity', 'Move', 'Solana', 'blockchain', 'web3'],
  authors: [{ name: 'Taichi Audit Group' }],
  creator: 'Taichi Audit Group',
  publisher: 'Taichi Audit Group',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Taichi Audit Group - DeFi Security Experts',
    description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews.',
    url: 'https://taichiaudit.com',
    siteName: 'Taichi Audit Group',
    images: [
      {
        url: '/taichi_logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Taichi Audit Group Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taichi Audit Group - DeFi Security Experts',
    description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews.',
    images: ['/taichi_logo.jpg'],
    site: '@TaichiAudit', // Add your Twitter handle here
    creator: '@TaichiAudit', // Add your Twitter handle here
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiScriptSrc = umamiUrl ? `${umamiUrl.replace(/\/$/, '')}/script.js` : undefined

  // Inline script to prevent dark mode FOUC — runs before any paint
  const themeScript = `
    (function() {
      try {
        var saved = localStorage.getItem('darkMode');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'true' || (saved === null && prefersDark)) {
          document.documentElement.classList.add('dark');
        }
      } catch(e) {}
    })();
  `

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${firaCode.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {umamiWebsiteId && umamiScriptSrc ? (
          <Script
            async
            defer
            src={umamiScriptSrc}
            data-website-id={umamiWebsiteId}
          />
        ) : null}
      </head>
      <body className="font-sans antialiased">
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  )
} 