'use client'

import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparisonRow {
  feature: string
  carplay: boolean | string
  android: boolean | string
  category: string
}

const comparisonData: ComparisonRow[] = [
  { feature: 'Real-time Price Alerts', carplay: true, android: true, category: 'Notifications' },
  { feature: 'Trade Confirmations', carplay: true, android: true, category: 'Notifications' },
  { feature: 'Portfolio Updates', carplay: true, android: true, category: 'Notifications' },
  { feature: 'Earnings Reminders', carplay: true, android: true, category: 'Notifications' },
  { feature: 'Voice-Activated Queries', carplay: 'Siri', android: 'Google', category: 'Voice Control' },
  { feature: 'Portfolio Summary', carplay: true, android: true, category: 'Voice Control' },
  { feature: 'Market Brief Playback', carplay: true, android: true, category: 'Voice Control' },
  { feature: 'Quick Navigation', carplay: true, android: true, category: 'Voice Control' },
  { feature: 'Navigation Integration', carplay: 'Apple Maps', android: 'Google Maps', category: 'Navigation' },
  { feature: 'Market Event Locations', carplay: true, android: true, category: 'Navigation' },
  { feature: 'Conference Routing', carplay: true, android: true, category: 'Navigation' },
  { feature: 'Market Audio Streaming', carplay: true, android: true, category: 'Media' },
  { feature: 'Podcast Integration', carplay: true, android: true, category: 'Media' },
  { feature: 'Earnings Call Audio', carplay: true, android: true, category: 'Media' },
  { feature: 'Glanceable Dashboard', carplay: true, android: true, category: 'Dashboard' },
  { feature: 'Watchlist Display', carplay: true, android: true, category: 'Dashboard' },
  { feature: 'Index Ticker Widget', carplay: false, android: true, category: 'Dashboard' },
]

export function PlatformComparison() {
  const categories = [...new Set(comparisonData.map((r) => r.category))]

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#2a2a2e]">
      <table className="w-full">
        <thead>
          <tr className="bg-[#1c1c1e]">
            <th className="text-left px-5 py-3 text-[13px] text-[#8e8e93] font-sans font-medium">Feature</th>
            <th className="text-center px-5 py-3 text-[13px] font-sans font-medium">
              <span className="text-[#007AFF]">Apple CarPlay</span>
            </th>
            <th className="text-center px-5 py-3 text-[13px] font-sans font-medium">
              <span className="text-[#34A853]">Android Auto</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <>
              <tr key={`cat-${category}`} className="bg-[#151517]">
                <td colSpan={3} className="px-5 py-2 text-[11px] text-[#FEC00F] font-sans font-semibold uppercase tracking-wider">
                  {category}
                </td>
              </tr>
              {comparisonData
                .filter((r) => r.category === category)
                .map((row) => (
                  <tr key={row.feature} className="border-t border-[#2a2a2e] hover:bg-[#1c1c1e] transition-colors">
                    <td className="px-5 py-2.5 text-[13px] text-[#e5e5ea] font-sans">{row.feature}</td>
                    <td className="text-center px-5 py-2.5">
                      {typeof row.carplay === 'string' ? (
                        <span className="text-[12px] text-[#007AFF] font-sans">{row.carplay}</span>
                      ) : row.carplay ? (
                        <Check className="w-4 h-4 text-[#007AFF] mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-[#3a3a3c] mx-auto" />
                      )}
                    </td>
                    <td className="text-center px-5 py-2.5">
                      {typeof row.android === 'string' ? (
                        <span className="text-[12px] text-[#34A853] font-sans">{row.android}</span>
                      ) : row.android ? (
                        <Check className="w-4 h-4 text-[#34A853] mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-[#3a3a3c] mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
