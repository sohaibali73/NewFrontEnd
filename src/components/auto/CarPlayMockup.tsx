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
  Battery,
  Signal,
  Home,
  Search,
  Volume2,
  Bell,
} from 'lucide-react'

type CarPlayScreen = 'home' | 'maps' | 'music' | 'phone' | 'messages'

interface NotificationItem {
  id: string
  app: string
  title: string
  message: string
  time: string
}

const notifications: NotificationItem[] = [
  { id: '1', app: 'Analyst', title: 'Market Alert', message: 'AAPL reached your target price of $198.50', time: '2m ago' },
  { id: '2', app: 'Analyst', title: 'Portfolio Update', message: 'Your portfolio is up 2.3% today', time: '5m ago' },
  { id: '3', app: 'Analyst', title: 'Trade Executed', message: 'Buy order filled: 50 shares MSFT @ $415.20', time: '12m ago' },
]

export function CarPlayMockup() {
  const [activeScreen, setActiveScreen] = useState<CarPlayScreen>('home')
  const [isPlaying, setIsPlaying] = useState(true)
  const [showNotification, setShowNotification] = useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col items-center">
        {/* Device Frame */}
        <div className="relative w-full max-w-[680px] aspect-[16/9] rounded-2xl border-[3px] border-[#2a2a2a] bg-[#0a0a0a] shadow-[0_0_60px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Signal className="w-3 h-3 text-[#8e8e93]" />
              <span className="text-[10px] text-[#8e8e93] font-sans">Potomac</span>
            </div>
            <span className="text-[10px] text-[#8e8e93] font-sans">9:41 AM</span>
            <div className="flex items-center gap-2">
              <Battery className="w-3.5 h-3.5 text-[#8e8e93]" />
              <span className="text-[10px] text-[#8e8e93] font-sans">87%</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="absolute inset-0 pt-6">
            {/* Home Screen */}
            {activeScreen === 'home' && (
              <div className="flex h-full">
                {/* Left: Map Preview */}
                <div className="flex-1 relative bg-[#1a1a2e] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Simulated map background */}
                      <div className="absolute inset-0 bg-[#1c1c3a]">
                        {/* Road grid */}
                        <div className="absolute inset-0">
                          <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-[#2d2d5a]" />
                          <div className="absolute top-[50%] left-0 right-0 h-[3px] bg-[#3a3a6a]" />
                          <div className="absolute top-[70%] left-0 right-0 h-[2px] bg-[#2d2d5a]" />
                          <div className="absolute left-[25%] top-0 bottom-0 w-[2px] bg-[#2d2d5a]" />
                          <div className="absolute left-[50%] top-0 bottom-0 w-[3px] bg-[#3a3a6a]" />
                          <div className="absolute left-[75%] top-0 bottom-0 w-[2px] bg-[#2d2d5a]" />
                          {/* Diagonal road */}
                          <div className="absolute top-[20%] left-[10%] w-[60%] h-[2px] bg-[#4a4a7a] rotate-[25deg] origin-left" />
                        </div>
                        {/* Location dot */}
                        <div className="absolute top-[48%] left-[48%]">
                          <div className="w-3 h-3 rounded-full bg-[#007AFF] shadow-[0_0_12px_rgba(0,122,255,0.6)]" />
                          <div className="absolute -inset-2 rounded-full bg-[#007AFF]/20 animate-ping" />
                        </div>
                      </div>
                      {/* Map overlay info */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-[#007AFF]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#e5e5ea] font-sans truncate">14 min to Potomac HQ</p>
                            <p className="text-[9px] text-[#8e8e93] font-sans">Via I-495 N - Fastest route</p>
                          </div>
                          <ChevronRight className="w-3 h-3 text-[#8e8e93]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: App Grid */}
                <div className="w-[45%] flex flex-col bg-[#0a0a0a] p-3 gap-2 overflow-y-auto">
                  {/* Now Playing Mini */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveScreen('music')}
                        className="flex items-center gap-2 bg-[#1c1c1e] rounded-xl px-3 py-2 hover:bg-[#2c2c2e] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fc3c44] to-[#a11d26] flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-[#ffffff]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] text-[#e5e5ea] font-sans truncate">Market Movers Podcast</p>
                          <p className="text-[9px] text-[#8e8e93] font-sans truncate">Potomac Audio</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-[#e5e5ea]" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-[#e5e5ea]" />
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                      <p className="font-sans text-xs">Analyst streams real-time market audio and podcasts directly in CarPlay</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* App Grid */}
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {[
                      { icon: MapPin, label: 'Maps', screen: 'maps' as CarPlayScreen, color: '#007AFF', tip: 'Navigate to market events, conferences, and saved locations from your Analyst watchlist' },
                      { icon: Phone, label: 'Phone', screen: 'phone' as CarPlayScreen, color: '#30d158', tip: 'Call your broker or team with one tap using Analyst contact integration' },
                      { icon: MessageSquare, label: 'Messages', screen: 'messages' as CarPlayScreen, color: '#30d158', tip: 'Receive and respond to Analyst alerts and trade notifications via voice' },
                      { icon: Mic, label: 'Siri', screen: 'home' as CarPlayScreen, color: '#bf5af2', tip: '"Hey Siri, check my portfolio" - Voice-activated market queries powered by Analyst' },
                      { icon: Bell, label: 'Alerts', screen: 'home' as CarPlayScreen, color: '#FEC00F', tip: 'Real-time price alerts, earnings notifications, and portfolio updates from Analyst' },
                      { icon: Search, label: 'Analyst', screen: 'home' as CarPlayScreen, color: '#00DED1', tip: 'Full Analyst by Potomac experience optimized for the CarPlay dashboard' },
                    ].map((app) => (
                      <Tooltip key={app.label}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveScreen(app.screen)}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-[#1c1c1e] transition-colors"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${app.color}20` }}
                            >
                              <app.icon className="w-5 h-5" style={{ color: app.color }} />
                            </div>
                            <span className="text-[10px] text-[#8e8e93] font-sans">{app.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px] bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                          <p className="font-sans text-xs">{app.tip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Maps Screen */}
            {activeScreen === 'maps' && (
              <div className="h-full relative bg-[#1a1a2e]">
                <div className="absolute inset-0 bg-[#1c1c3a]">
                  {/* Enhanced map grid */}
                  <div className="absolute inset-0">
                    <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-[#2d2d5a]" />
                    <div className="absolute top-[35%] left-0 right-0 h-[2px] bg-[#3a3a6a]" />
                    <div className="absolute top-[50%] left-0 right-0 h-[3px] bg-[#4a4a7a]" />
                    <div className="absolute top-[65%] left-0 right-0 h-[2px] bg-[#3a3a6a]" />
                    <div className="absolute top-[80%] left-0 right-0 h-[1px] bg-[#2d2d5a]" />
                    <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-[#2d2d5a]" />
                    <div className="absolute left-[35%] top-0 bottom-0 w-[2px] bg-[#3a3a6a]" />
                    <div className="absolute left-[55%] top-0 bottom-0 w-[3px] bg-[#4a4a7a]" />
                    <div className="absolute left-[75%] top-0 bottom-0 w-[2px] bg-[#3a3a6a]" />
                    <div className="absolute left-[90%] top-0 bottom-0 w-[1px] bg-[#2d2d5a]" />
                    {/* Highlighted route */}
                    <div className="absolute top-[35%] left-[35%] w-[40%] h-[1px] bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]" />
                    <div className="absolute top-[35%] left-[75%] w-[1px] h-[30%] bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]" />
                    {/* Location dot */}
                    <div className="absolute top-[48%] left-[52%]">
                      <div className="w-4 h-4 rounded-full bg-[#007AFF] shadow-[0_0_16px_rgba(0,122,255,0.6)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ffffff]" />
                      </div>
                    </div>
                    {/* Destination pin */}
                    <div className="absolute top-[18%] left-[73%]">
                      <div className="w-5 h-5 rounded-full bg-[#ff3b30] shadow-[0_0_12px_rgba(255,59,48,0.4)] flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-[#ffffff]" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Navigation info bar */}
                <div className="absolute top-8 left-3 right-3">
                  <div className="bg-[#007AFF] rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffffff]/20 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-[#ffffff] font-sans font-medium">Turn right onto Market St</p>
                      <p className="text-[10px] text-[#ffffff]/70 font-sans">in 0.3 mi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] text-[#ffffff] font-sans font-semibold">14 min</p>
                      <p className="text-[10px] text-[#ffffff]/70 font-sans">6.2 mi</p>
                    </div>
                  </div>
                </div>
                {/* Bottom ETA bar */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#30d158]" />
                      <span className="text-[11px] text-[#e5e5ea] font-sans">ETA 9:55 AM</span>
                    </div>
                    <span className="text-[11px] text-[#8e8e93] font-sans">Via I-495 N</span>
                    <button className="text-[11px] text-[#007AFF] font-sans font-medium">End</button>
                  </div>
                </div>
                {/* Back button */}
                <button
                  onClick={() => setActiveScreen('home')}
                  className="absolute bottom-3 left-3 z-10 hidden"
                />
              </div>
            )}

            {/* Music Screen */}
            {activeScreen === 'music' && (
              <div className="h-full flex flex-col bg-gradient-to-b from-[#1a0a0a] to-[#0a0a0a] px-6 pt-10 pb-4">
                <div className="flex-1 flex items-center justify-center gap-6">
                  {/* Album Art */}
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#FEC00F] to-[#e6a800] flex items-center justify-center shadow-[0_0_40px_rgba(254,192,15,0.3)]">
                    <div className="text-center">
                      <p className="text-[#0a0a0a] font-sans font-bold text-sm">POTOMAC</p>
                      <p className="text-[#0a0a0a]/70 font-sans text-[10px]">ANALYST</p>
                    </div>
                  </div>
                  {/* Track Info & Controls */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <p className="text-[15px] text-[#e5e5ea] font-sans font-medium">Market Movers Podcast</p>
                      <p className="text-[12px] text-[#8e8e93] font-sans">Potomac Audio - Episode 142</p>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#8e8e93] font-sans">12:34</span>
                      <div className="flex-1 h-1 bg-[#3a3a3c] rounded-full relative">
                        <div className="absolute left-0 top-0 h-full w-[45%] bg-[#e5e5ea] rounded-full" />
                        <div className="absolute left-[45%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#e5e5ea]" />
                      </div>
                      <span className="text-[9px] text-[#8e8e93] font-sans">27:50</span>
                    </div>
                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-6">
                      <button className="text-[#e5e5ea] hover:text-[#ffffff] transition-colors">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 rounded-full bg-[#e5e5ea] flex items-center justify-center hover:bg-[#ffffff] transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-[#0a0a0a]" />
                        ) : (
                          <Play className="w-5 h-5 text-[#0a0a0a] ml-0.5" />
                        )}
                      </button>
                      <button className="text-[#e5e5ea] hover:text-[#ffffff] transition-colors">
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Volume */}
                <div className="flex items-center gap-2 px-2">
                  <Volume2 className="w-3 h-3 text-[#8e8e93]" />
                  <div className="flex-1 h-1 bg-[#3a3a3c] rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-[65%] bg-[#8e8e93] rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Phone Screen */}
            {activeScreen === 'phone' && (
              <div className="h-full flex flex-col bg-[#0a0a0a] pt-10 px-4">
                <p className="text-[13px] text-[#8e8e93] font-sans mb-3 px-2">Recents</p>
                <div className="flex flex-col gap-1">
                  {[
                    { name: 'Trading Desk', time: '9:15 AM', type: 'Outgoing' },
                    { name: 'Sarah Chen - Analyst', time: '8:42 AM', type: 'Incoming' },
                    { name: 'Compliance Team', time: 'Yesterday', type: 'Missed' },
                    { name: 'Client: J. Morrison', time: 'Yesterday', type: 'Outgoing' },
                  ].map((call) => (
                    <Tooltip key={call.name}>
                      <TooltipTrigger asChild>
                        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1c1c1e] transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#30d158]/20 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-[#30d158]" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-[12px] text-[#e5e5ea] font-sans">{call.name}</p>
                            <p className={cn(
                              'text-[10px] font-sans',
                              call.type === 'Missed' ? 'text-[#ff3b30]' : 'text-[#8e8e93]'
                            )}>
                              {call.type} - {call.time}
                            </p>
                          </div>
                          <Phone className="w-4 h-4 text-[#30d158]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                        <p className="font-sans text-xs">Analyst syncs your professional contacts for hands-free calling</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Screen */}
            {activeScreen === 'messages' && (
              <div className="h-full flex flex-col bg-[#0a0a0a] pt-10 px-4">
                <p className="text-[13px] text-[#8e8e93] font-sans mb-3 px-2">Analyst Notifications</p>
                <div className="flex flex-col gap-1">
                  {notifications.map((notif) => (
                    <Tooltip key={notif.id}>
                      <TooltipTrigger asChild>
                        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1c1c1e] transition-colors text-left">
                          <div className="w-8 h-8 rounded-full bg-[#FEC00F]/20 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 text-[#FEC00F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] text-[#e5e5ea] font-sans font-medium">{notif.title}</p>
                              <span className="text-[9px] text-[#8e8e93] font-sans">{notif.time}</span>
                            </div>
                            <p className="text-[10px] text-[#8e8e93] font-sans truncate">{notif.message}</p>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[220px] bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                        <p className="font-sans text-xs">Analyst delivers real-time market notifications directly to your CarPlay dashboard</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating notification banner */}
          {showNotification && (
            <div className="absolute top-8 left-4 right-4 z-30 bg-[#2c2c2e]/95 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-xl">
              <div className="w-8 h-8 rounded-lg bg-[#FEC00F]/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#FEC00F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#e5e5ea] font-sans font-medium">Analyst Alert</p>
                <p className="text-[10px] text-[#8e8e93] font-sans truncate">TSLA up 4.2% - Breaking resistance at $248</p>
              </div>
              <button onClick={() => setShowNotification(false)} className="text-[10px] text-[#007AFF] font-sans">View</button>
            </div>
          )}

          {/* Bottom Dock */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1c1c1e]/90 backdrop-blur-md border-t border-[#3a3a3c]/50">
            <div className="flex items-center justify-around px-4 py-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveScreen('home')}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                      activeScreen === 'home' ? 'text-[#007AFF]' : 'text-[#8e8e93] hover:text-[#e5e5ea]'
                    )}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-[9px] font-sans">Home</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                  <p className="font-sans text-xs">CarPlay home screen with Analyst integration</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveScreen('maps')}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                      activeScreen === 'maps' ? 'text-[#007AFF]' : 'text-[#8e8e93] hover:text-[#e5e5ea]'
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-[9px] font-sans">Maps</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                  <p className="font-sans text-xs">Navigate to market events and saved locations</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveScreen('music')}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                      activeScreen === 'music' ? 'text-[#007AFF]' : 'text-[#8e8e93] hover:text-[#e5e5ea]'
                    )}
                  >
                    <Music className="w-4 h-4" />
                    <span className="text-[9px] font-sans">Audio</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                  <p className="font-sans text-xs">Market podcasts and audio briefings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setShowNotification(true)
                      setTimeout(() => setShowNotification(false), 4000)
                    }}
                    className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[#8e8e93] hover:text-[#e5e5ea] transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-[9px] font-sans">Alerts</span>
                    <div className="absolute top-0.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1e] text-[#e5e5ea] border-[#3a3a3c]">
                  <p className="font-sans text-xs">Tap to preview a live Analyst notification</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Navigation hint below device */}
        <p className="mt-4 text-xs text-[#8e8e93] font-sans text-center">
          Click the app icons and dock buttons to explore the CarPlay interface. Hover for feature details.
        </p>
      </div>
    </TooltipProvider>
  )
}
