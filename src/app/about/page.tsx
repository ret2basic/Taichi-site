import React from 'react'
import Navigation from '@/components/Navigation'
import AboutSection from '@/components/AboutSection'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                About <span className="text-primary-200">Taichi Audit</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                Born from the DeFiHackLabs community, we represent the next generation of security researchers with a proven track record in competitive auditing.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">60+</div>
                  <div className="text-sm opacity-90">Competitions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">11 times</div>
                  <div className="text-sm opacity-90">Audit Contests Top 3</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">170+</div>
                  <div className="text-sm opacity-90">Findings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">#7</div>
                  <div className="text-sm opacity-90">Remedy CTF 2025</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use AboutSection Component */}
        <AboutSection />
      </main>

      <Footer />
    </div>
  )
} 