'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MapPin,
  Music,
  Phone,
  MessageSquare,
  Mic,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Navigation,
  Clock,
  Home,
  Search,
  Volume2,
  Bell,
  TrendingUp,
  BarChart3,
  CircleDot,
  Compass,
} from 'lucide-react'

type AndroidScreen = 'home' | 'maps' | 'music' | 'analyst' | 'notifications'

export function AndroidAutoMockup() {
  const [activeScreen, setActiveScreen] = useState<AndroidScreen>('home')
  const [isPlaying, setIsPlaying] = useState(true)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col items-center">
        {/* Device Frame - Android Auto style with wider aspect */}
        <div className="relative w-full max-w-[680px] aspect-[16/9] rounded-2xl border-[3px] border-[#2a2a2a] bg-[#121212] shadow-[0_0_60px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(0,0,0,0.3)] overflow-hidden">

          {/* Status Bar - Material style */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-1 bg-[#121212]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#a0a0a0] font-sans">9:41</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn('w-[3px] rounded-sm', i <= 3 ? 'bg-[#a0a0a0]' : 'bg-[#4a4a4a]')} style={{ height: `${4 + i * 2}px` }} />
                ))}
              </div>
              <div className="w-5 h-2.5 border border-[#a0a0a0] rounded-sm relative">
                <div className="absolute inset-[1px] right-[30%] bg-[#a0a0a0] rounded-sm" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="absolute inset-0 pt-5 pb-12">
            {/* Home Screen */}
            {activeScreen === 'home' && (
              <div className="flex h-full">
                {/* Left: Navigation Summary */}
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#1a2332]">
                    {/* Map grid */}
                    <div className="absolute inset-0">
                      <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-[#243348]" />
                      <div className="absolute top-[45%] left-0 right-0 h-[2px] bg-[#2d4060]" />
                      <div className="absolute top-[65%] left-0 right-0 h-[1px] bg-[#243348]" />
                      <div className="absolute left-[20%] top-0 bottom-0 w-[1px] bg-[#243348]" />
                      <div className="absolute left-[45%] top-0 bottom-0 w-[2px] bg-[#2d4060]" />
                      <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-[#243348]" />
                      {/* Route line */}
                      <div className="absolute top-[45%] left-[20%] w-[50%] h-[3px] bg-[#4285F4] rounded-full shadow-[0_0_10px_rgba(66,133,244,0.5)]" />
                      <div className="absolute top-[25%] left-[70%] w-[3px] h-[20%] bg-[#4285F4] rounded-full shadow-[0_0_10px_rgba(66,133,244,0.5)]" />
                      {/* Current location */}
                      <div className="absolute top-[43%] left-[18%]">
                        <div className="w-4 h-4 rounded-full bg-[#4285F4] shadow-[0_0_12px_rgba(66,133,244,0.6)] flex items-center justify-center">
                          <Navigation className="w-2.5 h-2.5 text-[#ffffff] rotate-45" />
                        </div>
                      </div>
                    </div>
                    {/* Next direction card */}
                    <div className="absolute top-3 left-3 right-3">
                      <div className="bg-[#303134]/90 backdrop-blur rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center">
                          <ChevronRight className="w-6 h-6 text-[#ffffff]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] text-[#e8eaed] font-sans font-medium">Connecticut Ave NW</p>
                          <p className="text-[11px] text-[#9aa0a6] font-sans">0.5 mi - then turn left</p>
                        </div>
                      </div>
                    </div>
                    {/* ETA chip */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-[#303134]/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-[#34A853]" />
                        <span className="text-[11px] text-[#e8eaed] font-sans">12 min</span>
                        <span className="text-[11px] text-[#9aa0a6] font-sans">4.8 mi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Cards */}
                <div className="w-[42%] flex flex-col gap-2 p-3 overflow-y-auto">
                  {/* Now Playing Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveScreen('music')}
                        className="bg-[#303134] rounded-2xl px-3 py-2.5 flex items-center gap-3 hover:bg-[#3c4043] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FEC00F] to-[#e6a800] flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-[#121212]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[12px] text-[#e8eaed] font-sans truncate">Macro Outlook Brief</p>
                          <p className="text-[10px] text-[#9aa0a6] font-sans truncate">Potomac Audio</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SkipBack className="w-3.5 h-3.5 text-[#e8eaed]" />
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-[#e8eaed]" />
                          ) : (
                            <Play className="w-4 h-4 text-[#e8eaed]" />
                          )}
                          <SkipForward className="w-3.5 h-3.5 text-[#e8eaed]" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                      <p className="font-sans text-xs">Stream Analyst market briefs and podcasts via Android Auto</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Analyst Quick Card */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveScreen('analyst')}
                        className="bg-[#303134] rounded-2xl px-3 py-2.5 hover:bg-[#3c4043] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-[#FEC00F]/20 flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-[#FEC00F]" />
                          </div>
                          <span className="text-[11px] text-[#e8eaed] font-sans font-medium">Analyst Quick View</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[10px] text-[#34A853] font-sans">S&P 500</p>
                            <p className="text-[13px] text-[#e8eaed] font-sans font-medium">4,567.89</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-[#34A853] font-sans">NASDAQ</p>
                            <p className="text-[13px] text-[#e8eaed] font-sans font-medium">14,298.41</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-[#EA4335] font-sans">DOW</p>
                            <p className="text-[13px] text-[#e8eaed] font-sans font-medium">35,123.67</p>
                          </div>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px] bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                      <p className="font-sans text-xs">Glanceable market data from Analyst, updated in real-time on your Android Auto display</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Notification Preview */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveScreen('notifications')}
                        className="bg-[#303134] rounded-2xl px-3 py-2.5 flex items-center gap-3 hover:bg-[#3c4043] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#FEC00F]/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-[#FEC00F]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] text-[#e8eaed] font-sans">AAPL Target Hit</p>
                          <p className="text-[9px] text-[#9aa0a6] font-sans truncate">Price reached $198.50 target</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-[#EA4335] flex items-center justify-center">
                          <span className="text-[9px] text-[#ffffff] font-sans font-bold">3</span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px] bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                      <p className="font-sans text-xs">Analyst notifications appear as actionable cards - respond by voice while driving</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Maps Screen */}
            {activeScreen === 'maps' && (
              <div className="h-full relative bg-[#1a2332]">
                <div className="absolute inset-0">
                  {/* Full map view */}
                  <div className="absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`h-${i}`} className="absolute left-0 right-0 h-[1px] bg-[#243348]" style={{ top: `${12 + i * 12}%` }} />
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`v-${i}`} className="absolute top-0 bottom-0 w-[1px] bg-[#243348]" style={{ left: `${10 + i * 16}%` }} />
                    ))}
                    {/* Main route */}
                    <div className="absolute top-[48%] left-[10%] w-[60%] h-[4px] bg-[#4285F4] rounded-full shadow-[0_0_12px_rgba(66,133,244,0.5)]" />
                    <div className="absolute top-[24%] left-[70%] w-[4px] h-[24%] bg-[#4285F4] rounded-full shadow-[0_0_12px_rgba(66,133,244,0.5)]" />
                    {/* Current location */}
                    <div className="absolute top-[46%] left-[8%]">
                      <div className="w-5 h-5 rounded-full bg-[#4285F4] shadow-[0_0_16px_rgba(66,133,244,0.6)] flex items-center justify-center">
                        <Navigation className="w-3 h-3 text-[#ffffff] rotate-45" />
                      </div>
                      <div className="absolute -inset-3 rounded-full bg-[#4285F4]/15 animate-ping" />
                    </div>
                    {/* Destination */}
                    <div className="absolute top-[20%] left-[68%]">
                      <div className="w-6 h-6 rounded-full bg-[#EA4335] shadow-[0_0_12px_rgba(234,67,53,0.4)] flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-[#ffffff]" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Turn-by-turn banner */}
                <div className="absolute top-3 left-3 right-3">
                  <div className="bg-[#4285F4] rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffffff]/20 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-[#ffffff]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] text-[#ffffff] font-sans font-medium">Turn right on K Street NW</p>
                      <p className="text-[11px] text-[#ffffff]/70 font-sans">in 0.2 mi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] text-[#ffffff] font-sans font-bold">12 min</p>
                      <p className="text-[10px] text-[#ffffff]/70 font-sans">4.8 mi</p>
                    </div>
                  </div>
                </div>
                {/* Bottom ETA */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-[#303134]/90 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#34A853]" />
                    <span className="text-[12px] text-[#e8eaed] font-sans font-medium">ETA 9:53 AM</span>
                  </div>
                  <button className="bg-[#EA4335] rounded-full px-4 py-2">
                    <span className="text-[12px] text-[#ffffff] font-sans font-medium">Exit Nav</span>
                  </button>
                </div>
              </div>
            )}

            {/* Music Screen */}
            {activeScreen === 'music' && (
              <div className="h-full flex bg-[#121212] overflow-hidden">
                {/* Album Art */}
                <div className="w-[40%] flex items-center justify-center p-6">
                  <div className="w-full aspect-square max-w-[180px] rounded-2xl bg-gradient-to-br from-[#FEC00F] via-[#e6a800] to-[#cc9400] flex items-center justify-center shadow-[0_0_50px_rgba(254,192,15,0.25)]">
                    <div className="text-center">
                      <p className="text-[#121212] font-sans font-bold text-base">POTOMAC</p>
                      <p className="text-[#121212]/60 font-sans text-[11px] tracking-wider">ANALYST</p>
                    </div>
                  </div>
                </div>
                {/* Controls */}
                <div className="flex-1 flex flex-col justify-center gap-4 pr-6">
                  <div>
                    <p className="text-[16px] text-[#e8eaed] font-sans font-medium">Macro Outlook Brief</p>
                    <p className="text-[13px] text-[#9aa0a6] font-sans">Potomac Audio - Weekly Series</p>
                  </div>
                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#9aa0a6] font-sans w-8 text-right">8:22</span>
                    <div className="flex-1 h-1 bg-[#5f6368] rounded-full relative">
                      <div className="absolute left-0 top-0 h-full w-[35%] bg-[#FEC00F] rounded-full" />
                      <div className="absolute left-[35%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FEC00F] shadow-[0_0_6px_rgba(254,192,15,0.4)]" />
                    </div>
                    <span className="text-[10px] text-[#9aa0a6] font-sans w-8">23:45</span>
                  </div>
                  {/* Playback */}
                  <div className="flex items-center justify-center gap-8">
                    <button className="text-[#e8eaed] hover:text-[#ffffff] transition-colors">
                      <SkipBack className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-[#e8eaed] flex items-center justify-center hover:bg-[#ffffff] transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-[#121212]" />
                      ) : (
                        <Play className="w-6 h-6 text-[#121212] ml-0.5" />
                      )}
                    </button>
                    <button className="text-[#e8eaed] hover:text-[#ffffff] transition-colors">
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>
                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-[#9aa0a6]" />
                    <div className="flex-1 h-1 bg-[#5f6368] rounded-full relative">
                      <div className="absolute left-0 top-0 h-full w-[55%] bg-[#9aa0a6] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analyst Screen */}
            {activeScreen === 'analyst' && (
              <div className="h-full flex flex-col bg-[#121212] p-4 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#FEC00F]/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#FEC00F]" />
                  </div>
                  <span className="text-[14px] text-[#e8eaed] font-sans font-medium">Analyst Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {[
                    { label: 'S&P 500', value: '4,567.89', change: '+1.24%', positive: true },
                    { label: 'NASDAQ', value: '14,298.41', change: '+0.87%', positive: true },
                    { label: 'DOW', value: '35,123.67', change: '-0.32%', positive: false },
                    { label: 'AAPL', value: '$198.50', change: '+2.14%', positive: true },
                    { label: 'MSFT', value: '$415.20', change: '+1.05%', positive: true },
                    { label: 'TSLA', value: '$248.30', change: '+4.21%', positive: true },
                  ].map((item) => (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <div className="bg-[#303134] rounded-xl px-3 py-2.5 flex flex-col gap-1 hover:bg-[#3c4043] transition-colors cursor-pointer">
                          <span className="text-[10px] text-[#9aa0a6] font-sans">{item.label}</span>
                          <span className="text-[14px] text-[#e8eaed] font-sans font-medium">{item.value}</span>
                          <span className={cn(
                            'text-[11px] font-sans font-medium',
                            item.positive ? 'text-[#34A853]' : 'text-[#EA4335]'
                          )}>
                            {item.change}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                        <p className="font-sans text-xs">Tap to hear detailed analysis via voice for {item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="mt-3 bg-[#303134] rounded-xl px-3 py-2 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#4285F4]" />
                  <span className="text-[11px] text-[#9aa0a6] font-sans">{"\"Hey Google, what's my portfolio performance?\""}</span>
                </div>
              </div>
            )}

            {/* Notifications Screen */}
            {activeScreen === 'notifications' && (
              <div className="h-full flex flex-col bg-[#121212] pt-6 px-4">
                <p className="text-[14px] text-[#e8eaed] font-sans font-medium mb-3">Analyst Notifications</p>
                <div className="flex flex-col gap-2">
                  {[
                    { title: 'Price Alert: AAPL', body: 'Reached target price $198.50. Up 2.14% today.', time: '2m', color: '#34A853' },
                    { title: 'Portfolio Update', body: 'Your portfolio gained $4,250 (+2.3%) today.', time: '5m', color: '#FEC00F' },
                    { title: 'Earnings Alert', body: 'MSFT reports earnings after market close today.', time: '15m', color: '#4285F4' },
                    { title: 'Trade Executed', body: 'Buy 50 MSFT @ $415.20 filled successfully.', time: '22m', color: '#34A853' },
                  ].map((notif, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <button className="bg-[#303134] rounded-2xl px-4 py-3 flex items-start gap-3 hover:bg-[#3c4043] transition-colors text-left">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${notif.color}20` }}
                          >
                            <Bell className="w-4 h-4" style={{ color: notif.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-[#e8eaed] font-sans font-medium">{notif.title}</p>
                              <span className="text-[9px] text-[#9aa0a6] font-sans">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-[#9aa0a6] font-sans mt-0.5">{notif.body}</p>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[220px] bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                        <p className="font-sans text-xs">Voice-responsive notifications - say &quot;Read more&quot; or &quot;Dismiss&quot; hands-free</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar - Material/Android Auto style */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#303134] border-t border-[#5f6368]/30">
            <div className="flex items-center justify-around px-2 py-1">
              {[
                { icon: Compass, label: 'Navigate', screen: 'maps' as AndroidScreen, tip: 'Google Maps integration with Analyst location data' },
                { icon: Music, label: 'Media', screen: 'music' as AndroidScreen, tip: 'Stream Analyst audio content hands-free' },
                { icon: Home, label: 'Home', screen: 'home' as AndroidScreen, tip: 'Android Auto home with Analyst widgets' },
                { icon: Phone, label: 'Calls', screen: 'home' as AndroidScreen, tip: 'Voice calls with contacts synced from Analyst' },
                { icon: BarChart3, label: 'Analyst', screen: 'analyst' as AndroidScreen, tip: 'Full Analyst dashboard optimized for Android Auto' },
              ].map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveScreen(item.screen)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                        activeScreen === item.screen
                          ? 'text-[#8ab4f8]'
                          : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[9px] font-sans">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#303134] text-[#e8eaed] border-[#5f6368]">
                    <p className="font-sans text-xs">{item.tip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Google Assistant FAB */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute bottom-14 right-4 z-20 w-10 h-10 rounded-full bg-[#ffffff] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <Mic className="w-5 h-5 text-[#4285F4]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] bg-[#303134] text-[#e8eaed] border-[#5f6368]">
              <p className="font-sans text-xs">{'"Hey Google, ask Analyst about my portfolio" - Voice control for all Analyst features'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation hint */}
        <p className="mt-4 text-xs text-[#9aa0a6] font-sans text-center">
          Click the navigation bar and cards to explore the Android Auto interface. Hover for feature details.
        </p>
      </div>
    </TooltipProvider>
  )
}
