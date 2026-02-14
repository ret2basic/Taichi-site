import React from 'react'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import WhyChooseUsSection from '@/components/WhyChooseUsSection'
import ContactSection from '@/components/ContactSection'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <WhyChooseUsSection />
      <ContactSection />
      <Footer />
    </main>
  )
} 