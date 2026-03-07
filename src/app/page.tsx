import React from 'react'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import WhyChooseUsSection from '@/components/WhyChooseUsSection'
import ContactSection from '@/components/ContactSection'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#090e19] text-gray-900 dark:text-white">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <WhyChooseUsSection />
      <ContactSection />
      <Footer />
    </main>
  )
} 