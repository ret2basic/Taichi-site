import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { DarkModeProvider } from '../lib/DarkModeContext'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Fira+Code:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  )
} 