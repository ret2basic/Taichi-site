import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://taichi-audit.com'),
  title: 'Taichi Audit Group - DeFi Security Experts',
  description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews. Incubated from DeFiHackLabs community.',
  keywords: ['DeFi', 'audit', 'security', 'smart contracts', 'Solidity', 'Move', 'Solana', 'blockchain', 'web3'],
  authors: [{ name: 'Taichi Audit Group' }],
  creator: 'Taichi Audit Group',
  publisher: 'Taichi Audit Group',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Taichi Audit Group - DeFi Security Experts',
    description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews.',
    url: 'https://taichi-audit.com',
    siteName: 'Taichi Audit Group',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Taichi Audit Group',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taichi Audit Group - DeFi Security Experts',
    description: 'Leading DeFi security audit group specializing in Solidity, Move, and Solana smart contract reviews.',
    images: ['/og-image.jpg'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
} 