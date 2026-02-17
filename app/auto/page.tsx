'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CarPlayMockup } from '@/components/auto/CarPlayMockup'
import { AndroidAutoMockup } from '@/components/auto/AndroidAutoMockup'
import { FeatureShowcase } from '@/components/auto/FeatureShowcase'
import { PlatformComparison } from '@/components/auto/PlatformComparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Smartphone,
  Car,
  ArrowRight,
  Sparkles,
  Monitor,
  ChevronDown,
} from 'lucide-react'

export default function AutoPage() {
  const [activePlatform, setActivePlatform] = useState<'carplay' | 'android'>('carplay')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#FEC00F]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#007AFF]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-[12px] text-[#8e8e93] font-sans">Analyst by Potomac</span>
            <span className="text-[12px] text-[#3a3a3c] font-sans">/</span>
            <span className="text-[12px] text-[#FEC00F] font-sans">Auto</span>
          </div>

          {/* Hero Text */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FEC00F]/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-[#FEC00F]" />
              </div>
              <span className="text-[13px] text-[#FEC00F] font-sans font-medium tracking-wide uppercase">Auto Integration</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl text-[#e5e5ea] font-bold leading-tight mb-5 text-balance"
              style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e5e5ea' }}
            >
              Your Markets,<br />
              <span className="text-[#FEC00F]">On the Road</span>
            </h1>
            <p className="text-lg text-[#8e8e93] font-sans leading-relaxed max-w-2xl text-pretty">
              Analyst by Potomac extends seamlessly to your vehicle. Get real-time market intelligence, 
              portfolio alerts, and voice-controlled trading insights through Apple CarPlay and Android Auto.
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-8 mt-10">
            {[
              { value: '< 200ms', label: 'Alert Latency' },
              { value: '100%', label: 'Hands-Free' },
              { value: '2 Platforms', label: 'Supported' },
              { value: 'Enterprise', label: 'Security' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl text-[#e5e5ea] font-sans font-bold">{stat.value}</span>
                <span className="text-[12px] text-[#8e8e93] font-sans mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="flex items-center justify-center mt-16">
            <div className="flex flex-col items-center gap-1 text-[#3a3a3c] animate-bounce">
              <span className="text-[10px] font-sans uppercase tracking-wider">Explore</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mockups Section */}
      <section className="relative py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-5 h-5 text-[#FEC00F]" />
            <h2
              className="text-2xl text-[#e5e5ea] font-bold"
              style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e5e5ea' }}
            >
              Interactive Headunit Preview
            </h2>
          </div>
          <p className="text-[14px] text-[#8e8e93] font-sans mb-8 max-w-2xl">
            Explore fully interactive mockups of the Analyst experience on both platforms. 
            Click through screens and hover over elements to discover feature details.
          </p>

          {/* Platform Tabs */}
          <Tabs
            value={activePlatform}
            onValueChange={(v) => setActivePlatform(v as 'carplay' | 'android')}
            className="w-full"
          >
            <TabsList className="bg-[#1c1c1e] border border-[#2a2a2e] p-1 mb-8">
              <TabsTrigger
                value="carplay"
                className={cn(
                  'px-6 py-2 text-[13px] font-sans font-medium rounded-md transition-all data-[state=active]:bg-[#007AFF]/10 data-[state=active]:text-[#007AFF] data-[state=active]:shadow-none text-[#8e8e93]'
                )}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  CarPlay
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="android"
                className={cn(
                  'px-6 py-2 text-[13px] font-sans font-medium rounded-md transition-all data-[state=active]:bg-[#34A853]/10 data-[state=active]:text-[#34A853] data-[state=active]:shadow-none text-[#8e8e93]'
                )}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V7H6v11zM3.5 7C2.67 7 2 7.67 2 8.5v7c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-7C5 7.67 4.33 7 3.5 7zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85.55 12.95.25 12 .25c-.95 0-1.85.3-2.64.88L7.88.65c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 6h12c0-.99-.97-2.75-2.47-3.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
                  </svg>
                  Android Auto
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="carplay" className="mt-0">
              <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-[#2a2a2e]">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-[#007AFF]" />
                  </div>
                  <h3
                    className="text-[15px] text-[#e5e5ea] font-semibold normal-case"
                    style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif', letterSpacing: 'normal', color: '#e5e5ea' }}
                  >
                    Apple CarPlay Experience
                  </h3>
                  <span className="ml-auto text-[11px] text-[#8e8e93] font-sans">iOS 16+ Required</span>
                </div>
                <CarPlayMockup />
              </div>
            </TabsContent>

            <TabsContent value="android" className="mt-0">
              <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-[#2a2a2e]">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-lg bg-[#34A853]/10 flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-[#34A853]" />
                  </div>
                  <h3
                    className="text-[15px] text-[#e5e5ea] font-semibold normal-case"
                    style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif', letterSpacing: 'normal', color: '#e5e5ea' }}
                  >
                    Android Auto Experience
                  </h3>
                  <span className="ml-auto text-[11px] text-[#8e8e93] font-sans">Android 9+ Required</span>
                </div>
                <AndroidAutoMockup />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-16 bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#FEC00F]" />
            <h2
              className="text-2xl text-[#e5e5ea] font-bold"
              style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e5e5ea' }}
            >
              Key Features
            </h2>
          </div>
          <p className="text-[14px] text-[#8e8e93] font-sans mb-8 max-w-2xl">
            Every feature is designed for driving safety first, delivering critical market intelligence 
            through voice, audio, and glanceable visuals.
          </p>
          <FeatureShowcase />
        </div>
      </section>

      {/* Platform Comparison Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2
              className="text-2xl text-[#e5e5ea] font-bold mb-2"
              style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e5e5ea' }}
            >
              Platform Comparison
            </h2>
            <p className="text-[14px] text-[#8e8e93] font-sans">
              Feature-for-feature breakdown across both automotive platforms
            </p>
          </div>
          <PlatformComparison />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FEC00F]/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl sm:text-4xl text-[#e5e5ea] font-bold mb-4"
            style={{ fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#e5e5ea' }}
          >
            Ready to Drive Smarter?
          </h2>
          <p className="text-[16px] text-[#8e8e93] font-sans mb-8 max-w-xl mx-auto text-pretty">
            Connect your Analyst account to Apple CarPlay or Android Auto and bring your 
            market intelligence to the road. Setup takes less than 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="flex items-center gap-2 bg-[#FEC00F] text-[#0a0a0a] px-6 py-3 rounded-xl font-sans font-semibold text-[14px] hover:bg-[#e6a800] transition-colors">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 bg-[#1c1c1e] text-[#e5e5ea] px-6 py-3 rounded-xl font-sans font-medium text-[14px] border border-[#2a2a2e] hover:border-[#3a3a3e] transition-colors">
              View Documentation
            </button>
          </div>
          <p className="text-[11px] text-[#3a3a3c] font-sans mt-6">
            Requires Analyst by Potomac subscription. Compatible with vehicles supporting CarPlay / Android Auto.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1c1c1e] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FEC00F] flex items-center justify-center">
              <span className="text-[10px] text-[#0a0a0a] font-sans font-bold">P</span>
            </div>
            <span className="text-[13px] text-[#8e8e93] font-sans">Analyst by Potomac</span>
          </div>
          <p className="text-[11px] text-[#3a3a3c] font-sans">
            Apple CarPlay is a trademark of Apple Inc. Android Auto is a trademark of Google LLC.
          </p>
        </div>
      </footer>
    </div>
  )
}
