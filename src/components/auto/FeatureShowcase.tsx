'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Navigation,
  Music,
  Bell,
  Mic,
  TrendingUp,
  Shield,
  Phone,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Feature {
  id: string
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  details: string[]
  platform: 'both' | 'carplay' | 'android'
  color: string
}

const features: Feature[] = [
  {
    id: 'navigation',
    icon: Navigation,
    title: 'Smart Navigation',
    subtitle: 'Market-Aware Routing',
    description: 'Navigate to market events, conferences, and meetings with routes optimized for your trading schedule.',
    details: [
      'Auto-route to saved locations from your Analyst watchlist',
      'Calendar integration surfaces next meeting destination automatically',
      'Real-time traffic avoidance ensures you never miss a market open',
      'Points of interest include financial districts and conference venues',
    ],
    platform: 'both',
    color: '#007AFF',
  },
  {
    id: 'media',
    icon: Music,
    title: 'Market Audio',
    subtitle: 'Streaming Intelligence',
    description: 'Listen to real-time market briefs, analyst calls, and podcasts curated by Potomac.',
    details: [
      'Pre-market briefings play automatically during morning commute',
      'Earnings call audio streamed directly from Analyst',
      'Custom podcast feeds based on your portfolio holdings',
      'Voice-controlled playback: skip, rewind, bookmark key moments',
    ],
    platform: 'both',
    color: '#FEC00F',
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Live Notifications',
    subtitle: 'Never Miss a Signal',
    description: 'Receive price alerts, trade confirmations, and portfolio updates without taking your eyes off the road.',
    details: [
      'Priority filtering shows only critical alerts while driving',
      'Audio announcements for price targets and stop-loss triggers',
      'Batch notification summary at traffic stops',
      'One-tap actions: acknowledge, snooze, or escalate alerts',
    ],
    platform: 'both',
    color: '#EB2F5C',
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice Commands',
    subtitle: 'Hands-Free Trading Intelligence',
    description: 'Ask Siri or Google Assistant about your portfolio, market conditions, and analyst reports.',
    details: [
      '"What\'s my portfolio performance today?" - instant summary',
      '"Read my latest Analyst notifications" - audio readback',
      '"Navigate to the next conference" - smart routing',
      '"Play the morning market brief" - audio control',
    ],
    platform: 'both',
    color: '#bf5af2',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Glanceable Dashboard',
    subtitle: 'At-a-Glance Market Data',
    description: 'Key market indices and portfolio metrics displayed in a driving-safe, large-format layout.',
    details: [
      'Top 6 watchlist items with real-time price and change data',
      'Portfolio P&L summary updated every 30 seconds',
      'Color-coded indicators visible in peripheral vision',
      'Optimized text size meets automotive HMI safety standards',
    ],
    platform: 'both',
    color: '#00DED1',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Secure Connection',
    subtitle: 'Enterprise-Grade Security',
    description: 'End-to-end encrypted connection between your phone and vehicle head unit.',
    details: [
      'Biometric authentication before displaying sensitive data',
      'Auto-lock when vehicle is parked and phone disconnected',
      'No data cached on the vehicle infotainment system',
      'Compliance-ready audit logging for regulated environments',
    ],
    platform: 'both',
    color: '#34A853',
  },
]

export function FeatureShowcase() {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature) => {
        const isExpanded = expandedFeature === feature.id
        return (
          <button
            key={feature.id}
            onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
            className={cn(
              'relative text-left bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 transition-all duration-300 hover:border-[#3a3a3e] group',
              isExpanded && 'border-[#3a3a3e] shadow-lg'
            )}
          >
            {/* Platform Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
              {(feature.platform === 'both' || feature.platform === 'carplay') && (
                <span className="text-[9px] bg-[#2a2a2e] text-[#8e8e93] px-2 py-0.5 rounded-full font-sans">CarPlay</span>
              )}
              {(feature.platform === 'both' || feature.platform === 'android') && (
                <span className="text-[9px] bg-[#2a2a2e] text-[#8e8e93] px-2 py-0.5 rounded-full font-sans">Android</span>
              )}
            </div>

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${feature.color}15` }}
            >
              <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-[15px] text-[#e5e5ea] font-sans font-semibold mb-0.5 normal-case" style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif', letterSpacing: 'normal' }}>
              {feature.title}
            </h3>
            <p className="text-[11px] font-sans mb-2" style={{ color: feature.color }}>
              {feature.subtitle}
            </p>

            {/* Description */}
            <p className="text-[13px] text-[#8e8e93] font-sans leading-relaxed">
              {feature.description}
            </p>

            {/* Expand indicator */}
            <div className="flex items-center justify-center mt-3">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#8e8e93]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#8e8e93] group-hover:text-[#e5e5ea] transition-colors" />
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[#2a2a2e] animate-in slide-in-from-top-1">
                <ul className="flex flex-col gap-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: feature.color }}
                      />
                      <span className="text-[12px] text-[#a0a0a5] font-sans leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
