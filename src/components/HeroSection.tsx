'use client'
import React from 'react'
import { Shield, ArrowRight, Star, Users, FileCheck } from 'lucide-react'

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      
      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-texture opacity-40" />
      
      {/* Animated gradient blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-medium mb-8 dark:bg-primary-900 dark:text-primary-200">
            <Shield className="w-4 h-4 mr-2" />
            Incubated from DeFiHackLabs Community
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="block">Secure DeFi with</span>
            <span className="block gradient-text">Taichi Audit</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Leading DeFi security audit group specializing in <span className="font-semibold text-primary-600 dark:text-primary-400">Solidity</span>, <span className="font-semibold text-secondary-600 dark:text-secondary-400">Move</span>, and <span className="font-semibold text-primary-600 dark:text-primary-400">Solana</span> smart contract security reviews.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href="#contact"
              className="bg-primary-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-700 transition-all duration-200 flex items-center group shadow-lg hover:shadow-xl"
            >
              Request Audit
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#portfolio"
              className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:text-white transition-all duration-200 flex items-center"
            >
              View Portfolio
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg dark:bg-slate-800/50">
              <div className="bg-primary-100 p-3 rounded-full mb-4 dark:bg-primary-900">
                <FileCheck className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300 text-center">Smart Contracts Audited</div>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg dark:bg-slate-800/50">
              <div className="bg-secondary-100 p-3 rounded-full mb-4 dark:bg-secondary-900">
                <Star className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">100+</div>
              <div className="text-gray-600 dark:text-gray-300 text-center">Vulnerabilities Found</div>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg dark:bg-slate-800/50">
              <div className="bg-primary-100 p-3 rounded-full mb-4 dark:bg-primary-900">
                <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">$50M+</div>
              <div className="text-gray-600 dark:text-gray-300 text-center">Total Value Secured</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
} 