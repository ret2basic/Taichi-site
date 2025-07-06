import React from 'react'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import ServicesSection from '@/components/ServicesSection'
import StatsSection from '@/components/StatsSection'
import AboutSection from '@/components/AboutSection'
import ContactSection from '@/components/ContactSection'
import Footer from '@/components/Footer'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  )
} 