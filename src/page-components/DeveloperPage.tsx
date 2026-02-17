'use client'

import React, { useState, useCallback } from 'react'
import {
  Code2,
  Smartphone,
  ArrowRight,
  Layers,
  Database,
  MessageCircle,
  TrendingUp,
  Zap,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Copy,
  Check,
  BookOpen,
  GitBranch,
  Shield,
  Paintbrush,
  Monitor,
  Search,
  Upload,
  Eye,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  FileText,
  Tablet,
  Laptop,
  ChevronLeft,
  Wifi,
  BatteryFull,
  Signal,
  Clock,
  Glasses,
  Mic,
  Bell,
  Activity,
  ClipboardCopy,
  Volume2,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

// ========================================================================
// DEVICE FRAME COMPONENTS
// ========================================================================

// ─── Status Bar (shared by iPhone & iPad) ────────────────────────────────
function IOSStatusBar({ time = '9:41', light = false }: { time?: string; light?: boolean }) {
  const color = light ? '#000' : '#fff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '100%' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Signal size={10} color={color} />
        <Wifi size={10} color={color} />
        <BatteryFull size={12} color={color} />
      </div>
    </div>
  )
}

// ─── iPhone Frame ─────────────────────────────────────────────────────────
function IPhoneFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
  size = 'normal',
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
  size?: 'small' | 'normal' | 'large'
}) {
  const dims = { small: { w: 180, h: 380, r: 28, p: 8, di: { w: 64, h: 20 }, ir: 18 }, normal: { w: 280, h: 580, r: 36, p: 12, di: { w: 100, h: 28 }, ir: 24 }, large: { w: 340, h: 700, r: 44, p: 14, di: { w: 120, h: 32 }, ir: 30 } }
  const d = dims[size]

  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', transform: isActive ? 'scale(1.02)' : 'scale(1)' }}>
      <div
        style={{
          width: `${d.w}px`,
          height: `${d.h}px`,
          borderRadius: `${d.r}px`,
          border: `3px solid ${isActive ? '#FEC00F' : colors.border}`,
          backgroundColor: '#000000',
          padding: `${d.p}px`,
          position: 'relative',
          boxShadow: isActive
            ? '0 0 40px rgba(254, 192, 15, 0.15), 0 20px 60px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: `${d.p}px`, left: '50%', transform: 'translateX(-50%)', width: `${d.di.w}px`, height: `${d.di.h}px`, borderRadius: '20px', backgroundColor: '#000', zIndex: 10 }} />
        {/* Side buttons */}
        <div style={{ position: 'absolute', right: '-3px', top: '120px', width: '3px', height: '50px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '0 2px 2px 0' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '100px', width: '3px', height: '30px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '140px', width: '3px', height: '42px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '190px', width: '3px', height: '42px', backgroundColor: isActive ? '#FEC00F' : colors.border, borderRadius: '2px 0 0 2px' }} />
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: `${d.ir}px`, overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: `${d.p + 4}px`, left: '50%', transform: 'translateX(-50%)', width: `${d.w * 0.35}px`, height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: size === 'small' ? '11px' : '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted, transition: 'color 0.3s ease' }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ─── iPad Frame ───────────────────────────────────────────────────────────
function IPadFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
}) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
      <div
        style={{
          width: '520px',
          height: '380px',
          borderRadius: '20px',
          border: `3px solid ${isActive ? '#FEC00F' : colors.border}`,
          backgroundColor: '#000000',
          padding: '12px',
          position: 'relative',
          boxShadow: isActive ? '0 0 40px rgba(254, 192, 15, 0.12), 0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Front camera */}
        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', zIndex: 10 }} />
        <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.25)' }} />
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ─── Mac Frame (Enhanced with menu bar, hover traffic lights) ─────────────
function MacFrame({
  children,
  label,
  colors,
}: {
  children: React.ReactNode
  label: string
  colors: Record<string, string>
}) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  return (
    <div>
      <div
        style={{
          width: '620px',
          borderRadius: '12px',
          border: `2px solid ${colors.border}`,
          backgroundColor: '#1a1a1a',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Menu bar strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 16px', backgroundColor: '#222', borderBottom: '1px solid #333', fontSize: '11px', color: '#999', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>{'<Analyst/>'}</span>
          <span style={{ cursor: 'default' }}>File</span>
          <span style={{ cursor: 'default' }}>Edit</span>
          <span style={{ cursor: 'default' }}>View</span>
          <span style={{ cursor: 'default' }}>Window</span>
          <span style={{ cursor: 'default' }}>Help</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '10px', color: '#666' }}>Mon 9:41 AM</span>
        </div>
        {/* Title bar with hover-enabled traffic lights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#2a2a2a', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: '6px' }} onMouseLeave={() => setHoveredBtn(null)}>
            <div onMouseEnter={() => setHoveredBtn('close')} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s' }}>
              {hoveredBtn === 'close' && <span style={{ fontSize: '8px', fontWeight: 700, color: '#4a0002', lineHeight: 1 }}>{'x'}</span>}
            </div>
            <div onMouseEnter={() => setHoveredBtn('min')} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {hoveredBtn === 'min' && <span style={{ fontSize: '10px', fontWeight: 700, color: '#5a3e00', lineHeight: 1, marginTop: '-2px' }}>-</span>}
            </div>
            <div onMouseEnter={() => setHoveredBtn('max')} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {hoveredBtn === 'max' && <span style={{ fontSize: '7px', fontWeight: 700, color: '#0a5417', lineHeight: 1 }}>{'<>'}</span>}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 16px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'text' }}>
              <Shield size={9} color="#28c840" />
              <span style={{ fontSize: '11px', color: '#999', fontFamily: 'system-ui' }}>analyst.potomac.com</span>
            </div>
          </div>
          {/* Keyboard shortcut hint */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>Cmd+K</div>
          </div>
        </div>
        {/* Screen content */}
        <div style={{ height: '380px', overflow: 'hidden', backgroundColor: colors.screenBg }}>
          {children}
        </div>
      </div>
      {/* Stand */}
      <div style={{ width: '80px', height: '30px', margin: '0 auto', background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)', clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }} />
      <div style={{ width: '160px', height: '6px', margin: '0 auto', borderRadius: '0 0 4px 4px', backgroundColor: '#2a2a2a' }} />
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ========================================================================
// SCREEN MOCKUP COMPONENTS
// ========================================================================

// ─── Splash Screen ──────────────────────────────────────────────────────
function SplashMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0B', position: 'relative' }}>
      {/* Radial glow */}
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,192,15,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 32px rgba(254,192,15,0.2)' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '24px', color: '#fff', letterSpacing: '6px' }}>ANALYST</span>
        <span style={{ fontSize: '9px', color: '#FEC00F', letterSpacing: '5px', marginTop: '6px', fontWeight: 600 }}>BY POTOMAC</span>
        {/* Loading indicator */}
        <div style={{ marginTop: '40px', width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#2A2A2A', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '50%', height: '100%', backgroundColor: '#FEC00F', borderRadius: '2px', animation: 'shimmer 1.5s ease-in-out infinite', left: '-50%' }} />
        </div>
      </div>
      {/* Bottom text */}
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <span style={{ fontSize: '8px', color: '#555', letterSpacing: '2px' }}>VERSION 1.0</span>
      </div>
    </div>
  )
}

// ─── Login Screen ───────────────────────────────────────────────────────
function LoginMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0A0A0B' }}>
      {/* Status bar area */}
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      {/* Top brand area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', boxShadow: '0 4px 20px rgba(254,192,15,0.15)' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', letterSpacing: '3px' }}>ANALYST</span>
        <span style={{ fontSize: '9px', color: '#FEC00F', letterSpacing: '4px', marginTop: '4px' }}>BY POTOMAC</span>
      </div>
      {/* Form area */}
      <div style={{ padding: '20px', borderTop: '1px solid #2A2A2A' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>WELCOME BACK</span>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '9px', color: '#9E9E9E', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>EMAIL</div>
          <div style={{ height: '34px', borderRadius: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
            <span style={{ fontSize: '10px', color: '#555' }}>you@example.com</span>
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '9px', color: '#9E9E9E', fontWeight: 600, letterSpacing: '0.5px' }}>PASSWORD</div>
            <span style={{ fontSize: '8px', color: '#FEC00F' }}>Forgot?</span>
          </div>
          <div style={{ height: '34px', borderRadius: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
            <span style={{ fontSize: '10px', color: '#555' }}>{'*'.repeat(8)}</span>
            <Eye size={12} color="#555" />
          </div>
        </div>
        <div style={{ marginTop: '14px', height: '38px', borderRadius: '10px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogIn size={14} color="#0A0A0B" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '1px' }}>SIGN IN</span>
        </div>
        {/* Biometric */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px' }}>&#xf276;</span>
          </div>
          <span style={{ fontSize: '9px', color: '#757575' }}>Sign in with Face ID</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '9px', color: '#757575' }}>{"Don't have an account? "}</span>
          <span style={{ fontSize: '9px', color: '#FEC00F', fontWeight: 600 }}>Create one</span>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Screen ───────────────────────────────────────────────────
function DashboardMockup({ colors }: { colors: Record<string, string> }) {
  const features = [
    { icon: Code2, label: 'AFL Generator', color: '#3B82F6', desc: 'Generate trading code' },
    { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6', desc: 'Ask Yang anything' },
    { icon: Database, label: 'Knowledge Base', color: '#22C55E', desc: '24 documents' },
    { icon: TrendingUp, label: 'Backtest', color: '#F97316', desc: 'Analyze strategies' },
  ]
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      {/* Header with logo */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '1px', display: 'block', lineHeight: 1.1 }}>
              Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
            </span>
            <span style={{ fontSize: '8px', color: '#9E9E9E' }}>Potomac Analyst Workbench</span>
          </div>
        </div>
        <div style={{ height: '32px', borderRadius: '10px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={12} color="#212121" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700, color: '#212121', letterSpacing: '0.5px' }}>START GENERATING</span>
        </div>
      </div>
      {/* Feature Cards */}
      <div style={{ flex: 1, padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', fontWeight: 600, color: '#9E9E9E', letterSpacing: '0.5px' }}>FEATURES</span>
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#1E1E1E', borderRadius: '12px', border: '1px solid #2E2E2E' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={f.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8', display: 'block' }}>{f.label}</span>
                <span style={{ fontSize: '8px', color: '#757575' }}>{f.desc}</span>
              </div>
              <ArrowRight size={12} color="#FEC00F" />
            </div>
          )
        })}
      </div>
      <MockupTabBar active="Home" />
    </div>
  )
}

// ─── Chat Screen ────────────────────────────────────────────────────────
function ChatMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2E2E2E' }}>
        <ChevronLeft size={18} color="#FEC00F" />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>AI CHAT</span>
        <Plus size={18} color="#FEC00F" />
      </div>
      {/* Messages */}
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
          <div style={{ padding: '8px 12px', borderRadius: '16px 16px 4px 16px', backgroundColor: '#FEC00F', fontSize: '10px', color: '#0A0A0B', lineHeight: 1.4, fontWeight: 500 }}>
            Analyze AAPL for a momentum strategy
          </div>
          <span style={{ fontSize: '7px', color: '#555', display: 'block', textAlign: 'right', marginTop: '3px' }}>9:41 AM</span>
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src="/potomac-icon.png" alt="Yang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#FEC00F' }}>Yang</span>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: '4px 16px 16px 16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <p style={{ fontSize: '9px', color: '#d4d4d4', lineHeight: 1.5, margin: 0 }}>
              Based on AAPL analysis, I recommend a dual moving average crossover with RSI confirmation...
            </p>
            <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', backgroundColor: '#262626', border: '1px solid #333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={10} color="#22C55E" />
                <span style={{ fontSize: '8px', fontWeight: 600, color: '#22C55E' }}>Stock Analysis</span>
              </div>
              <span style={{ fontSize: '8px', color: '#9E9E9E', marginTop: '4px', display: 'block' }}>AAPL: $198.45 (+2.3%)</span>
            </div>
          </div>
        </div>
      </div>
      {/* Input */}
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #2E2E2E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '22px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <Plus size={14} color="#757575" />
          <span style={{ fontSize: '10px', color: '#757575', flex: 1 }}>Ask Yang anything...</span>
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={12} color="#0A0A0B" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AFL Generator Screen ───────────────────────────────────────────────
function AFLMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>AFL GENERATOR</span>
      </div>
      {/* Prompt input */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2E2E2E' }}>
        <div style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <span style={{ fontSize: '9px', color: '#757575' }}>Describe your trading strategy...</span>
        </div>
      </div>
      {/* Code area */}
      <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '10px', backgroundColor: '#0d1117', border: '1px solid #2E2E2E', padding: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28c840' }} />
            </div>
            <span style={{ fontSize: '8px', color: '#555', fontFamily: 'monospace' }}>strategy.afl</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', lineHeight: 1.7, color: '#adbac7' }}>
            <div><span style={{ color: '#f47067' }}>// </span><span style={{ color: '#768390' }}>Momentum Strategy</span></div>
            <div><span style={{ color: '#6cb6ff' }}>FastMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(C, <span style={{ color: '#6cb6ff' }}>10</span>);</div>
            <div><span style={{ color: '#6cb6ff' }}>SlowMA</span> = <span style={{ color: '#dcbdfb' }}>MA</span>(C, <span style={{ color: '#6cb6ff' }}>50</span>);</div>
            <div><span style={{ color: '#6cb6ff' }}>RSIVal</span> = <span style={{ color: '#dcbdfb' }}>RSI</span>(<span style={{ color: '#6cb6ff' }}>14</span>);</div>
            <div />
            <div><span style={{ color: '#f47067' }}>Buy</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(FastMA,SlowMA)</div>
            <div>  AND RSIVal {'<'} <span style={{ color: '#6cb6ff' }}>70</span>;</div>
            <div><span style={{ color: '#f47067' }}>Sell</span> = <span style={{ color: '#dcbdfb' }}>Cross</span>(SlowMA,FastMA)</div>
            <div>  OR RSIVal {'>'} <span style={{ color: '#6cb6ff' }}>80</span>;</div>
          </div>
        </div>
      </div>
      {/* Bottom actions */}
      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #2E2E2E', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, height: '34px', borderRadius: '10px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Zap size={12} color="#212121" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '10px', fontWeight: 700, color: '#212121' }}>GENERATE</span>
        </div>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Copy size={12} color="#9E9E9E" />
        </div>
      </div>
    </div>
  )
}

// ─── Knowledge Base Screen ──────────────────────────────────────────────
function KnowledgeMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>KNOWLEDGE BASE</span>
        <Plus size={18} color="#FEC00F" />
      </div>
      {/* Search */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
          <Search size={12} color="#757575" />
          <span style={{ fontSize: '10px', color: '#757575' }}>Search documents...</span>
        </div>
      </div>
      {/* Stats */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: '8px' }}>
        {[
          { label: 'Documents', value: '24', color: '#FEC00F' },
          { label: 'Total Size', value: '12 MB', color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, padding: '10px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <span style={{ fontSize: '8px', color: '#9E9E9E', display: 'block' }}>{s.label}</span>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Document list */}
      <div style={{ flex: 1, padding: '0 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {['Trading Strategies.pdf', 'RSI_Analysis.csv', 'Market_Report.pdf'].map((doc) => (
          <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <FileText size={14} color="#FEC00F" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#E8E8E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc}</div>
              <div style={{ fontSize: '8px', color: '#757575', marginTop: '2px' }}>2 days ago</div>
            </div>
            <Trash2 size={12} color="#555" />
          </div>
        ))}
      </div>
      {/* Upload */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ height: '38px', borderRadius: '12px', border: '1px dashed rgba(254,192,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Upload size={12} color="#FEC00F" />
          <span style={{ fontSize: '10px', color: '#FEC00F', fontWeight: 600 }}>Upload Document</span>
        </div>
      </div>
    </div>
  )
}

// ─── Backtest Screen ────────────────────────────────────────────────────
function BacktestMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>BACKTEST</span>
      </div>
      {/* Upload area */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ padding: '14px', borderRadius: '12px', border: '1px dashed rgba(254,192,15,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Upload size={18} color="#FEC00F" />
          <span style={{ fontSize: '10px', color: '#FEC00F', fontWeight: 600 }}>Upload Results</span>
        </div>
      </div>
      {/* Metrics */}
      <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'CAGR', value: '18.5%', color: '#22C55E' },
          { label: 'Sharpe', value: '1.82', color: '#3B82F6' },
          { label: 'Max DD', value: '-12.3%', color: '#DC2626' },
          { label: 'Win Rate', value: '67.2%', color: '#FEC00F' },
        ].map((m) => (
          <div key={m.label} style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <span style={{ fontSize: '8px', color: '#9E9E9E' }}>{m.label}</span>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: m.color, marginTop: '2px' }}>{m.value}</div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div style={{ flex: 1, padding: '10px 12px' }}>
        <div style={{ height: '100%', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', padding: '12px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
          {[40, 55, 45, 65, 50, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: h > 60 ? 'rgba(34,197,94,0.4)' : 'rgba(254,192,15,0.3)', borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      </div>
      <MockupTabBar active="More" />
    </div>
  )
}

// ─── Content Screen ─────────────────────────────────────────────────────
function ContentMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>CONTENT</span>
      </div>
      {/* Segment control */}
      <div style={{ display: 'flex', padding: '10px 12px', gap: '3px', borderBottom: '1px solid #2E2E2E' }}>
        {['Chat', 'Slides', 'Articles', 'Docs'].map((tab, i) => (
          <div key={tab} style={{ flex: 1, padding: '7px', borderRadius: '8px', backgroundColor: i === 0 ? '#FEC00F' : '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: i === 0 ? '#212121' : '#9E9E9E' }}>{tab}</span>
          </div>
        ))}
      </div>
      {/* Content list */}
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
        {[
          { title: 'Q4 Market Analysis', type: 'Article', date: 'Jan 15' },
          { title: 'Trading Strategy Deck', type: 'Slides', date: 'Jan 12' },
          { title: 'Risk Report 2026', type: 'Document', date: 'Jan 10' },
        ].map((item) => (
          <div key={item.title} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#E8E8E8' }}>{item.title}</span>
              <span style={{ fontSize: '7px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(254,192,15,0.1)', color: '#FEC00F', fontWeight: 600 }}>{item.type}</span>
            </div>
            <span style={{ fontSize: '8px', color: '#757575' }}>{item.date}</span>
          </div>
        ))}
      </div>
      <MockupTabBar active="More" />
    </div>
  )
}

// ─── Settings Screen ────────────────────────────────────────────────────
function SettingsMockup({ colors }: { colors: Record<string, string> }) {
  const items = [
    { icon: Shield, label: 'Profile', desc: 'Name, email, nickname', color: '#3B82F6' },
    { icon: Settings, label: 'API Keys', desc: 'Claude, Tavily keys', color: '#F97316' },
    { icon: Paintbrush, label: 'Appearance', desc: 'Theme, colors, font', color: '#8B5CF6' },
    { icon: Sparkles, label: 'Notifications', desc: 'Email & push alerts', color: '#22C55E' },
    { icon: Eye, label: 'Security', desc: 'Password, Face ID', color: '#DC2626' },
  ]
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.screenBg }}>
      <div style={{ height: '48px', padding: '14px 0 0' }}><IOSStatusBar /></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2E2E2E' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>SETTINGS</span>
      </div>
      {/* User card */}
      <div style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#212121' }}>S</span>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#E8E8E8' }}>Sohaib Ali</div>
          <div style={{ fontSize: '9px', color: '#757575' }}>sohaib@potomac.com</div>
        </div>
      </div>
      {/* Items */}
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8' }}>{item.label}</div>
                <div style={{ fontSize: '8px', color: '#757575', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <ChevronRightIcon size={14} color="#555" />
            </div>
          )
        })}
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ height: '38px', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogOut size={12} color="#DC2626" />
          <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>SIGN OUT</span>
        </div>
      </div>
    </div>
  )
}

// ─── iPad Dashboard (landscape) ─────────────────────────────────────────
function IPadDashboardMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: colors.screenBg }}>
      {/* iPad sidebar */}
      <div style={{ width: '200px', borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', backgroundColor: '#161616', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #2E2E2E' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '6px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>ANALYST</span>
        </div>
        <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Code2, label: 'AFL Generator', active: false },
            { icon: MessageCircle, label: 'AI Chat', active: false },
            { icon: Database, label: 'Knowledge', active: false },
            { icon: TrendingUp, label: 'Backtest', active: false },
            { icon: Sparkles, label: 'Content', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', backgroundColor: item.active ? '#FEC00F' : 'transparent' }}>
                <Icon size={13} color={item.active ? '#212121' : '#757575'} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: item.active ? '#212121' : '#9E9E9E' }}>{item.label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '10px', color: '#212121' }}>S</span>
          </div>
          <span style={{ fontSize: '9px', color: '#E8E8E8', fontWeight: 600 }}>Sohaib Ali</span>
        </div>
      </div>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2E2E2E' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
            Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
          </span>
        </div>
        <div style={{ flex: 1, padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', overflow: 'hidden' }}>
          {[
            { icon: Code2, label: 'AFL Generator', color: '#3B82F6', desc: 'Generate trading code' },
            { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6', desc: 'Ask Yang anything' },
            { icon: Database, label: 'Knowledge Base', color: '#22C55E', desc: '24 documents indexed' },
            { icon: TrendingUp, label: 'Backtest', color: '#F97316', desc: 'Analyze strategies' },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={f.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#E8E8E8', display: 'block' }}>{f.label}</span>
                  <span style={{ fontSize: '8px', color: '#757575' }}>{f.desc}</span>
                </div>
                <ArrowRight size={14} color="#FEC00F" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── iPad Chat (landscape) ──────────────────────────────────────────────
function IPadChatMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: colors.screenBg }}>
      {/* Conversation list sidebar */}
      <div style={{ width: '200px', borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', backgroundColor: '#161616', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2E2E2E' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>CHATS</span>
          <Plus size={14} color="#FEC00F" />
        </div>
        <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
          {['AAPL Momentum', 'Portfolio Review', 'RSI Strategy'].map((chat, i) => (
            <div key={chat} style={{ padding: '10px', borderRadius: '8px', backgroundColor: i === 0 ? 'rgba(254,192,15,0.1)' : 'transparent', border: i === 0 ? '1px solid rgba(254,192,15,0.2)' : '1px solid transparent' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: i === 0 ? '#FEC00F' : '#9E9E9E', display: 'block' }}>{chat}</span>
              <span style={{ fontSize: '8px', color: '#555', marginTop: '2px', display: 'block' }}>2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Yang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>AAPL MOMENTUM</span>
        </div>
        <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          <div style={{ alignSelf: 'flex-end', maxWidth: '60%' }}>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 4px 16px', backgroundColor: '#FEC00F', fontSize: '10px', color: '#0A0A0B', lineHeight: 1.4, fontWeight: 500 }}>Analyze AAPL for a momentum strategy</div>
          </div>
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', fontSize: '9px', color: '#d4d4d4', lineHeight: 1.6 }}>
              Based on AAPL analysis, I recommend a dual moving average crossover strategy with RSI confirmation. The 10/50 MA crossover with RSI below 70 provides strong entry signals...
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #2E2E2E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '14px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E' }}>
            <span style={{ fontSize: '10px', color: '#757575', flex: 1 }}>Ask Yang anything...</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={14} color="#0A0A0B" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mac Dashboard ──────────────────────────────────────────────────────
function MacDashboardMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: colors.screenBg }}>
      {/* Mac sidebar */}
      <div style={{ width: '180px', borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', backgroundColor: '#0e0e0e', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #2E2E2E' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
            <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>ANALYST</span>
        </div>
        <div style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Code2, label: 'AFL Generator', active: false },
            { icon: MessageCircle, label: 'AI Chat', active: false },
            { icon: Database, label: 'Knowledge', active: false },
            { icon: TrendingUp, label: 'Backtest', active: false },
            { icon: Sparkles, label: 'Content', active: false },
            { icon: Zap, label: 'Reverse Engineer', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', backgroundColor: item.active ? '#FEC00F' : 'transparent' }}>
                <Icon size={12} color={item.active ? '#212121' : '#757575'} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: item.active ? '#212121' : '#9E9E9E' }}>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>Welcome, <span style={{ color: '#FEC00F' }}>Trader</span></span>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEC00F, #FFD740)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '9px', color: '#212121' }}>S</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', overflow: 'hidden', alignContent: 'start' }}>
          {[
            { icon: Code2, label: 'AFL Generator', color: '#3B82F6' },
            { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6' },
            { icon: Database, label: 'Knowledge', color: '#22C55E' },
            { icon: TrendingUp, label: 'Backtest', color: '#F97316' },
            { icon: Sparkles, label: 'Content', color: '#EC4899' },
            { icon: Zap, label: 'Reverse Eng.', color: '#06B6D4' },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={f.color} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#E8E8E8' }}>{f.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ========================================================================
// APPLE WATCH COMPONENTS
// ========================================================================

function AppleWatchFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
}) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', transform: isActive ? 'scale(1.04)' : 'scale(1)' }}>
      {/* Band top */}
      <div style={{ width: '100px', height: '24px', margin: '0 auto', borderRadius: '6px 6px 0 0', background: 'linear-gradient(180deg, #333 0%, #2a2a2a 100%)', borderTop: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderLeft: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderRight: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderBottom: 'none' }} />
      <div
        style={{
          width: '180px',
          height: '220px',
          borderRadius: '38px',
          border: `3px solid ${isActive ? '#FEC00F' : colors.border}`,
          backgroundColor: '#000',
          padding: '14px',
          position: 'relative',
          boxShadow: isActive ? '0 0 30px rgba(254,192,15,0.15), 0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Digital Crown */}
        <div style={{ position: 'absolute', right: '-8px', top: '55px', width: '6px', height: '24px', borderRadius: '3px', backgroundColor: isActive ? '#FEC00F' : '#555', border: '1px solid #333' }} />
        {/* Side button */}
        <div style={{ position: 'absolute', right: '-7px', top: '90px', width: '5px', height: '14px', borderRadius: '2px', backgroundColor: isActive ? '#FEC00F' : '#444' }} />
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: '28px', overflow: 'hidden', backgroundColor: '#000' }}>
          {children}
        </div>
      </div>
      {/* Band bottom */}
      <div style={{ width: '100px', height: '24px', margin: '0 auto', borderRadius: '0 0 6px 6px', background: 'linear-gradient(180deg, #2a2a2a 0%, #333 100%)', borderBottom: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderLeft: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderRight: `2px solid ${isActive ? '#FEC00F' : colors.border}`, borderTop: 'none' }} />
      {label && (
        <p style={{ textAlign: 'center', marginTop: '10px', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ─── Watch Complication ──────────────────────────────────────────────────
function WatchComplicationMockup() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', position: 'relative' }}>
      {/* Time */}
      <span style={{ fontSize: '32px', fontWeight: 200, color: '#fff', fontFamily: 'system-ui, -apple-system', letterSpacing: '-1px', lineHeight: 1 }}>9:41</span>
      <span style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>MONDAY 17</span>
      {/* Complication ring */}
      <div style={{ marginTop: '12px', width: '64px', height: '64px', borderRadius: '50%', border: '3px solid #FEC00F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#22C55E', transform: 'rotate(-30deg)' }} />
        <Activity size={10} color="#FEC00F" />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', marginTop: '2px', fontFamily: "'Rajdhani', sans-serif" }}>$48.2K</span>
        <span style={{ fontSize: '6px', color: '#22C55E', fontWeight: 600 }}>+2.3%</span>
      </div>
      {/* Bottom complications */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Bell size={8} color="#FEC00F" />
          <span style={{ fontSize: '7px', color: '#FEC00F', fontWeight: 600 }}>3</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <TrendingUp size={8} color="#22C55E" />
          <span style={{ fontSize: '7px', color: '#22C55E', fontWeight: 600 }}>AAPL</span>
        </div>
      </div>
    </div>
  )
}

// ─── Watch Quick Glance ─────────────────────────────────────────────────
function WatchGlanceMockup() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000', padding: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '9px', fontWeight: 700, color: '#FEC00F', letterSpacing: '0.5px' }}>ANALYST</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ padding: '6px 8px', borderRadius: '10px', backgroundColor: '#1a1a1a' }}>
          <span style={{ fontSize: '7px', color: '#9E9E9E', display: 'block' }}>PORTFOLIO</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Rajdhani', sans-serif" }}>$48,234</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ flex: 1, padding: '5px 6px', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
            <span style={{ fontSize: '6px', color: '#9E9E9E', display: 'block' }}>TOP MOVER</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#22C55E' }}>AAPL +2.3%</span>
          </div>
          <div style={{ flex: 1, padding: '5px 6px', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
            <span style={{ fontSize: '6px', color: '#9E9E9E', display: 'block' }}>ALERTS</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#FEC00F' }}>3 new</span>
          </div>
        </div>
        <div style={{ padding: '5px 8px', borderRadius: '8px', backgroundColor: 'rgba(254,192,15,0.1)', border: '1px solid rgba(254,192,15,0.2)' }}>
          <span style={{ fontSize: '7px', color: '#FEC00F', fontWeight: 600 }}>Open Analyst</span>
        </div>
      </div>
    </div>
  )
}

// ─── Watch Notification ─────────────────────────────────────────────────
function WatchNotificationMockup() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000', padding: '10px 8px' }}>
      {/* App header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', overflow: 'hidden' }}>
          <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: '8px', color: '#FEC00F', fontWeight: 600 }}>ANALYST</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '7px', color: '#666' }}>now</span>
      </div>
      {/* Notification content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <TrendingUp size={8} color="#22C55E" />
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#22C55E' }}>MOMENTUM SIGNAL</span>
          </div>
          <span style={{ fontSize: '8px', color: '#d4d4d4', lineHeight: 1.4, display: 'block' }}>
            AAPL triggered buy signal at $198.45 - RSI crossover confirmed
          </span>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ flex: 1, padding: '6px', borderRadius: '8px', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#0A0A0B' }}>VIEW</span>
          </div>
          <div style={{ flex: 1, padding: '6px', borderRadius: '8px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 600, color: '#999' }}>DISMISS</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Watch Dictation ────────────────────────────────────────────────────
function WatchDictationMockup() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '10px' }}>
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '9px', fontWeight: 600, color: '#FEC00F', letterSpacing: '0.5px', marginBottom: '6px' }}>ASK YANG</span>
      {/* Waveform visualization */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '30px', marginBottom: '10px' }}>
        {[12, 20, 28, 18, 24, 30, 16, 22, 26, 14, 20, 24].map((h, i) => (
          <div key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', backgroundColor: i % 3 === 0 ? '#FEC00F' : 'rgba(254,192,15,0.4)', transition: 'height 0.2s' }} />
        ))}
      </div>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(254,192,15,0.3)' }}>
        <Mic size={18} color="#0A0A0B" />
      </div>
      <span style={{ fontSize: '7px', color: '#666', marginTop: '8px' }}>{'Tap to speak...'}</span>
    </div>
  )
}

// ========================================================================
// APPLE VISION PRO COMPONENTS
// ========================================================================

function VisionProFrame({
  children,
  label,
  isActive,
  onClick,
  colors,
}: {
  children: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  colors: Record<string, string>
}) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
      <div
        style={{
          width: '640px',
          height: '340px',
          borderRadius: '24px',
          border: `2px solid ${isActive ? '#FEC00F' : 'rgba(255,255,255,0.1)'}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          padding: '3px',
          position: 'relative',
          boxShadow: isActive
            ? '0 0 60px rgba(254,192,15,0.08), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Glass edge effect */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)', pointerEvents: 'none' }} />
        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: '22px', overflow: 'hidden', backgroundColor: 'rgba(10,10,11,0.95)', position: 'relative' }}>
          {children}
          {/* Eye tracking reticle hint */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Eye size={8} color="#999" />
            <Sparkles size={8} color="#999" />
          </div>
        </div>
      </div>
      {label && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: isActive ? '#FEC00F' : colors.textMuted }}>
          {label}
        </p>
      )}
    </div>
  )
}

// ─── Vision Pro Spatial Dashboard ────────────────────────────────────────
function VisionProDashboardMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,11,0.95)', padding: '20px', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,192,15,0.03) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      {/* Floating panels */}
      <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, perspective: '1200px' }}>
        {/* Left panel - Dashboard */}
        <div style={{ width: '180px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', transform: 'rotateY(8deg) translateZ(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src="/potomac-icon.png" alt="Analyst" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>DASHBOARD</span>
          </div>
          {[
            { icon: Code2, label: 'AFL Gen', color: '#3B82F6' },
            { icon: MessageCircle, label: 'AI Chat', color: '#8B5CF6' },
            { icon: Database, label: 'Knowledge', color: '#22C55E' },
            { icon: TrendingUp, label: 'Backtest', color: '#F97316' },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '4px' }}>
                <Icon size={11} color={f.color} />
                <span style={{ fontSize: '9px', color: '#d4d4d4', fontWeight: 500 }}>{f.label}</span>
              </div>
            )
          })}
        </div>
        {/* Center panel - Main content */}
        <div style={{ width: '240px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', transform: 'translateZ(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.4)' }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
            Welcome, <span style={{ color: '#FEC00F' }}>Trader</span>
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Portfolio', value: '$48.2K', color: '#FEC00F' },
              { label: 'Today P&L', value: '+$1.1K', color: '#22C55E' },
            ].map((m) => (
              <div key={m.label} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '7px', color: '#999', display: 'block' }}>{m.label}</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
          {/* Mini chart */}
          <div style={{ height: '50px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
            {[35, 42, 38, 52, 48, 60, 55, 68, 62, 75, 70, 80].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: h > 55 ? 'rgba(34,197,94,0.35)' : 'rgba(254,192,15,0.2)', borderRadius: '2px 2px 0 0' }} />
            ))}
          </div>
        </div>
        {/* Right panel - Quick actions */}
        <div style={{ width: '140px', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(40px)', transform: 'rotateY(-8deg) translateZ(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '8px', color: '#999', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>QUICK ACTIONS</span>
          {['New Strategy', 'Ask Yang', 'Upload Doc'].map((a) => (
            <div key={a} style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: 'rgba(254,192,15,0.06)', border: '1px solid rgba(254,192,15,0.12)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '8px', color: '#FEC00F', fontWeight: 600 }}>{a}</span>
            </div>
          ))}
          <div style={{ marginTop: '8px', padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <Volume2 size={8} color="#999" />
            <span style={{ fontSize: '7px', color: '#999' }}>{'Voice input'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vision Pro Immersive Chat ──────────────────────────────────────────
function VisionProChatMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(10,10,11,0.95)', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '8px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', overflow: 'hidden' }}>
          <img src="/potomac-icon.png" alt="Yang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>AI CHAT</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '8px', color: '#666', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)' }}>Spatial View</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '50%' }}>
          <div style={{ padding: '10px 14px', borderRadius: '14px 14px 4px 14px', backgroundColor: '#FEC00F', fontSize: '10px', color: '#0A0A0B', lineHeight: 1.4, fontWeight: 500 }}>Analyze AAPL for a momentum strategy</div>
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '65%' }}>
          <div style={{ padding: '12px 14px', borderRadius: '4px 14px 14px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <p style={{ fontSize: '10px', color: '#d4d4d4', lineHeight: 1.5, margin: 0 }}>
              Based on AAPL analysis, I recommend a dual MA crossover strategy with RSI confirmation. The 10/50 MA crossover with RSI below 70 provides optimal entry signals...
            </p>
            <div style={{ marginTop: '8px', padding: '8px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={10} color="#22C55E" />
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#22C55E' }}>AAPL: $198.45 (+2.3%)</span>
              </div>
            </div>
          </div>
          {/* Typing indicator */}
          <div style={{ display: 'flex', gap: '3px', marginTop: '6px', padding: '4px 0' }}>
            <span style={{ fontSize: '8px', color: '#FEC00F' }}>Yang</span>
            <span style={{ fontSize: '8px', color: '#555' }}>- Read</span>
          </div>
        </div>
      </div>
      {/* Spatial keyboard hint */}
      <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={12} color="#666" />
        <span style={{ fontSize: '10px', color: '#757575', flex: 1 }}>Ask Yang anything...</span>
        <Mic size={12} color="#FEC00F" />
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEC00F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={12} color="#0A0A0B" />
        </div>
      </div>
    </div>
  )
}

// ─── Vision Pro 3D Data Viz ─────────────────────────────────────────────
function VisionProDataVizMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(10,10,11,0.95)', padding: '16px 24px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>3D EQUITY CURVE</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['1W', '1M', '3M', '1Y'].map((t) => (
            <div key={t} style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: t === '3M' ? '#FEC00F' : 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
              <span style={{ fontSize: '8px', fontWeight: 600, color: t === '3M' ? '#0A0A0B' : '#999' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 3D perspective chart */}
      <div style={{ flex: 1, position: 'relative', perspective: '800px' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', transform: 'rotateX(8deg) rotateY(-3deg)', transformOrigin: 'center center', display: 'flex', flexDirection: 'column' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            {[
              { label: 'CAGR', value: '18.5%', color: '#22C55E' },
              { label: 'Sharpe', value: '1.82', color: '#3B82F6' },
              { label: 'Max DD', value: '-12.3%', color: '#DC2626' },
              { label: 'Win Rate', value: '67.2%', color: '#FEC00F' },
            ].map((m) => (
              <div key={m.label}>
                <span style={{ fontSize: '7px', color: '#666', display: 'block' }}>{m.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: m.color, fontFamily: "'Rajdhani', sans-serif" }}>{m.value}</span>
              </div>
            ))}
          </div>
          {/* Chart bars with depth */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {[30, 45, 38, 55, 42, 60, 52, 72, 65, 80, 75, 88, 70, 85, 78, 92].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', background: `linear-gradient(180deg, ${h > 60 ? 'rgba(34,197,94,0.5)' : 'rgba(254,192,15,0.35)'} 0%, ${h > 60 ? 'rgba(34,197,94,0.15)' : 'rgba(254,192,15,0.1)'} 100%)`, boxShadow: h > 60 ? '0 0 8px rgba(34,197,94,0.15)' : 'none' }} />
            ))}
          </div>
          {/* Grid lines */}
          <div style={{ position: 'absolute', inset: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.1 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ borderBottom: '1px solid #fff' }} />
            ))}
          </div>
        </div>
      </div>
      {/* Gesture hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
        <Sparkles size={10} color="#666" />
        <span style={{ fontSize: '8px', color: '#555' }}>Pinch to zoom - Rotate to explore</span>
      </div>
    </div>
  )
}

// ========================================================================
// COPY AS MARKDOWN BUTTON
// ========================================================================

function CopyAsMarkdownButton({
  activeDevice,
  activeScreen,
  screens,
  deviceSpecs,
  colors,
}: {
  activeDevice: string
  activeScreen: string
  screens: Array<{ id: string; label: string }>
  deviceSpecs: Array<{ label: string; value: string }>
  colors: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const currentScreen = screens.find((s) => s.id === activeScreen)
    const lines = [
      `# Device Mockup: ${activeDevice.toUpperCase()}`,
      '',
      `## Active Screen: ${currentScreen?.label || activeScreen}`,
      '',
      '## Device Specifications',
      ...deviceSpecs.map((s) => `- **${s.label}**: ${s.value}`),
      '',
      '## All Available Screens',
      ...screens.map((s) => `- ${s.label}${s.id === activeScreen ? ' (active)' : ''}`),
      '',
      '## UI Elements',
      '- Navigation: Tab bar / Sidebar (device adaptive)',
      '- Primary Action: START GENERATING (brand yellow #FEC00F)',
      '- Features: AFL Generator, AI Chat, Knowledge Base, Backtest, Content, Settings',
      '- Brand: Potomac Analyst Workbench',
      '- Typography: Rajdhani (headings), Quicksand (body)',
      '',
      `---`,
      `*Exported from Potomac Analyst Developer Blueprint*`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [activeDevice, activeScreen, screens, deviceSpecs])

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: copied ? 'rgba(34,197,94,0.1)' : colors.cardBg,
        color: copied ? '#22C55E' : colors.textMuted,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : colors.border}`,
      }}
    >
      {copied ? <Check size={14} color="#22C55E" /> : <ClipboardCopy size={14} />}
      {copied ? 'COPIED AS MARKDOWN' : 'COPY AS MARKDOWN'}
    </button>
  )
}

// ─── CarPlay Vehicle Headunit Mockup ──────────────────────────────────────
function CarPlayMockup({ colors }: { colors: Record<string, string> }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', padding: '20px' }}>
      {/* Vehicle Headunit Display - Widescreen Landscape */}
      <div style={{ width: '100%', maxWidth: '900px', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)' }}>
          
          {/* Status Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#fff" />
                <span style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{'2:30 PM'}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>{'72°F'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Signal size={16} color="#5AC85A" />
              <Wifi size={16} color="#fff" />
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{'P'}</span>
            </div>
          </div>
          
          {/* Main Content - Split View */}
          <div style={{ flex: 1, display: 'flex', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            
            {/* Left: Navigation */}
            <div style={{ flex: 2, background: '#000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* Map Simulation */}
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a4d2e 0%, #0d2818 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 20, left: 20, right: 20 }}>
                  <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'linear-gradient(135deg, #4A90E2, #357ABD)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '24px' }}>{'🧭'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>{'Main Street'}</div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{'in 0.3 miles, turn right'}</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#4A90E2' }}>{'15'}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{'min'}</div>
                  </div>
                </div>
                
                {/* Route indicator */}
                <div style={{ fontSize: '80px', opacity: 0.2 }}>{'➡️'}</div>
                
                {/* Bottom nav controls */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '20px' }}>{'🔍'}</span>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '20px' }}>{'🏠'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: App Drawer & Now Playing */}
            <div style={{ width: '320px', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
              
              {/* App Grid */}
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Phone App */}
                <div style={{ aspectRatio: '1', borderRadius: '16px', background: 'linear-gradient(135deg, #34C759 0%, #30B352 100%)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(52,199,89,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '28px' }}>{'📞'}</span>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700 }}>{'2'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', color: '#fff', fontWeight: 700 }}>{'Phone'}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{'2 missed calls'}</div>
                  </div>
                </div>
                
                {/* Messages App */}
                <div style={{ aspectRatio: '1', borderRadius: '16px', background: 'linear-gradient(135deg, #FFD60A 0%, #FFC400 100%)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(255,214,10,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MessageCircle size={28} color="#000" />
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700 }}>{'5'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', color: '#000', fontWeight: 700 }}>{'Messages'}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '2px' }}>{'Yang: Trade alert'}</div>
                  </div>
                </div>
                
              </div>
              
              {/* Now Playing */}
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', margin: '0 20px 20px', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}>
                <div>
                  <div style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', background: 'linear-gradient(135deg, #E94E77 0%, #C93E68 100%)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(233,78,119,0.4)' }}>
                    <Volume2 size={48} color="#fff" />
                  </div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>{'Market Analysis Podcast'}</div>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>{'Potomac Trading Insights'}</div>
                </div>
                
                {/* Playback Controls */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                    <div style={{ cursor: 'pointer' }}>
                      <ChevronLeft size={32} color="#999" />
                    </div>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: '20px', marginLeft: '4px' }}>{'▶'}</span>
                    </div>
                    <div style={{ cursor: 'pointer' }}>
                      <ChevronRightIcon size={32} color="#999" />
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ height: '4px', borderRadius: '2px', background: '#333', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: '45%', height: '100%', background: '#fff', borderRadius: '2px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>{'12:34'}</span>
                    <span>{'28:00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Control Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '24px' }}>{'🏠'}</span>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Activity size={24} color="#FEC00F" />
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Mic size={24} color="#fff" />
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Bell size={24} color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Bar (shared) ────────────────────────────────────────────────────
function MockupTabBar({ active = 'Home' }: { active?: string }) {
  return (
    <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', borderTop: '1px solid #2E2E2E', backgroundColor: '#0e0e0e', flexShrink: 0 }}>
      {[
        { icon: LayoutDashboard, label: 'Home' },
        { icon: MessageCircle, label: 'Chat' },
        { icon: Code2, label: 'AFL' },
        { icon: Database, label: 'KB' },
        { icon: Settings, label: 'More' },
      ].map((item) => {
        const Icon = item.icon
        const isActive = item.label === active
        return (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <Icon size={16} color={isActive ? '#FEC00F' : '#555'} />
            <span style={{ fontSize: '7px', color: isActive ? '#FEC00F' : '#555', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ========================================================================
// DOCUMENTATION COMPONENTS
// ========================================================================

function CodeSnippet({ code, language, title, colors }: { code: string; language: string; title?: string; colors: Record<string, string> }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: colors.codeBg, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title && <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.5px' }}>{title}</span>}
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(254,192,15,0.1)', color: '#FEC00F', fontWeight: 600, textTransform: 'uppercase' }}>{language}</span>
        </div>
        <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: colors.hoverBg, color: colors.textMuted, cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}>
          {copied ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ padding: '16px', margin: 0, overflow: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '12px', lineHeight: 1.6, color: '#adbac7', backgroundColor: '#0d1117' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CollapsibleSection({ title, children, defaultOpen = false, colors, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; colors: Record<string, string>; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '16px', transition: 'border-color 0.3s ease' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', border: 'none', backgroundColor: colors.cardBg, cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
        {open ? <ChevronDown size={18} color="#FEC00F" /> : <ChevronRightIcon size={18} color={colors.textMuted} />}
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: colors.text, letterSpacing: '0.5px', flex: 1, textAlign: 'left' }}>{title}</span>
        {badge && <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(254,192,15,0.1)', color: '#FEC00F', fontWeight: 600, letterSpacing: '0.5px' }}>{badge}</span>}
      </button>
      {open && <div style={{ padding: '0 20px 20px', backgroundColor: colors.cardBg }}>{children}</div>}
    </div>
  )
}

function MappingRow({ jsComponent, swiftUI, notes, colors }: { jsComponent: string; swiftUI: string; notes: string; colors: Record<string, string> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>
      <code style={{ color: '#FEC00F', fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 500 }}>{jsComponent}</code>
      <code style={{ color: '#8ddb8c', fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 500 }}>{swiftUI}</code>
      <span style={{ color: colors.textMuted, lineHeight: 1.5 }}>{notes}</span>
    </div>
  )
}

// ========================================================================
// MAIN DEVELOPER PAGE
// ========================================================================

export function DeveloperPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [activeScreen, setActiveScreen] = useState('splash')
  const [activeDevice, setActiveDevice] = useState<'iphone' | 'ipad' | 'mac' | 'watch' | 'visionpro'>('iphone')
  const [activeWatchScreen, setActiveWatchScreen] = useState('complication')
  const [activeVPScreen, setActiveVPScreen] = useState('dashboard')
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null)
  const [loginClicked, setLoginClicked] = useState(false)

  const colors = {
    background: isDark ? '#0A0A0B' : '#ffffff',
    surface: isDark ? '#121212' : '#f8f9fa',
    cardBg: isDark ? '#1A1A1A' : '#ffffff',
    inputBg: isDark ? '#262626' : '#f0f0f0',
    border: isDark ? '#2E2E2E' : '#e5e5e5',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    hoverBg: isDark ? '#262626' : '#f0f0f0',
    codeBg: isDark ? '#141414' : '#f5f5f5',
    screenBg: '#121212',
    accent: '#FEC00F',
  }

  const iphoneScreens = [
    { id: 'splash', label: 'SPLASH', component: SplashMockup },
    { id: 'login', label: 'LOGIN', component: LoginMockup },
    { id: 'dashboard', label: 'DASHBOARD', component: DashboardMockup },
    { id: 'chat', label: 'AI CHAT', component: ChatMockup },
    { id: 'afl', label: 'AFL GENERATOR', component: AFLMockup },
    { id: 'knowledge', label: 'KNOWLEDGE BASE', component: KnowledgeMockup },
    { id: 'backtest', label: 'BACKTEST', component: BacktestMockup },
    { id: 'content', label: 'CONTENT', component: ContentMockup },
    { id: 'settings', label: 'SETTINGS', component: SettingsMockup },
    { id: 'carplay', label: 'CARPLAY', component: CarPlayMockup },
  ]

  const ipadScreens = [
    { id: 'ipad-dashboard', label: 'DASHBOARD', component: IPadDashboardMockup },
    { id: 'ipad-chat', label: 'AI CHAT', component: IPadChatMockup },
  ]

  const activeScreenData = iphoneScreens.find((s) => s.id === activeScreen)
  const ActiveComponent = activeScreenData?.component || SplashMockup

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: "'Quicksand', sans-serif", transition: 'background-color 0.3s ease' }}>
      {/* Animations for splash screen, interactive elements */}
      <style>{`
        @keyframes shimmer { 0% { left: -50%; } 100% { left: 100%; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(254,192,15,0); } 50% { box-shadow: 0 0 12px 4px rgba(254,192,15,0.15); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div style={{ background: isDark ? 'linear-gradient(135deg, #0A0A0B 0%, #1A1A1D 50%, #0A0A0B 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)', borderBottom: `1px solid ${colors.border}`, padding: '48px 32px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(254,192,15,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(254,192,15,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(254,192,15,0.1)', border: '1px solid rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={28} color="#FEC00F" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '48px', fontWeight: 700, color: colors.text, letterSpacing: '2px', lineHeight: 1.1, margin: 0 }}>DEVELOPER</h1>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 500, color: '#FEC00F', letterSpacing: '6px', margin: '4px 0 0' }}>IOS APP BLUEPRINT</p>
            </div>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '16px', lineHeight: 1.7, maxWidth: '700px', margin: 0 }}>
            Full-scale interactive mockups and comprehensive SwiftUI translation guide for rebuilding the Potomac Analyst Workbench as a native Apple app across iPhone, iPad, Mac, Apple Watch, and Vision Pro with 1:1 feature parity. Includes high-fidelity device frames, interactive prototype elements, and markdown export.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { label: '9+ Screens', icon: Monitor },
              { label: 'SwiftUI 5', icon: Code2 },
              { label: 'iOS 17+', icon: Smartphone },
              { label: 'iPad + Mac', icon: Tablet },
              { label: 'Apple Watch', icon: Clock },
              { label: 'Vision Pro', icon: Glasses },
              { label: 'MVVM', icon: GitBranch },
            ].map((b) => {
              const Icon = b.icon
              return (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.06)', border: '1px solid rgba(254,192,15,0.15)' }}>
                  <Icon size={14} color="#FEC00F" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

        {/* ── Section 1: Device Selector ──────────────────────────────── */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Paintbrush size={22} color="#FEC00F" />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 700, color: colors.text, letterSpacing: '1.5px', margin: 0 }}>APP INTERFACE MOCKUPS</h2>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '14px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '700px' }}>
            Interactive mockups across all Apple platforms. Select a device and screen to preview with realistic device frames including Dynamic Island, notch area, safe area insets, and home indicator.
          </p>

          {/* Device type tabs + Copy as Markdown */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {([
              { id: 'iphone', label: 'iPhone 15 Pro', icon: Smartphone },
              { id: 'ipad', label: 'iPad Pro', icon: Tablet },
              { id: 'mac', label: 'Mac (Catalyst)', icon: Laptop },
              { id: 'watch', label: 'Apple Watch', icon: Clock },
              { id: 'visionpro', label: 'Vision Pro', icon: Glasses },
            ] as const).map((device) => {
              const Icon = device.icon
              const isDeviceActive = activeDevice === device.id
              return (
                <button key={device.id} onClick={() => setActiveDevice(device.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: isDeviceActive ? '#FEC00F' : colors.cardBg, color: isDeviceActive ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: isDeviceActive ? 'none' : `1px solid ${colors.border}` }}>
                  <Icon size={16} />
                  {device.label}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <CopyAsMarkdownButton
              activeDevice={activeDevice}
              activeScreen={activeDevice === 'watch' ? activeWatchScreen : activeDevice === 'visionpro' ? activeVPScreen : activeScreen}
              screens={activeDevice === 'watch' ? [
                { id: 'complication', label: 'COMPLICATION' },
                { id: 'glance', label: 'QUICK GLANCE' },
                { id: 'notification', label: 'NOTIFICATION' },
                { id: 'dictation', label: 'VOICE INPUT' },
              ] : activeDevice === 'visionpro' ? [
                { id: 'dashboard', label: 'SPATIAL DASHBOARD' },
                { id: 'chat', label: 'IMMERSIVE CHAT' },
                { id: 'dataviz', label: '3D DATA VIZ' },
              ] : iphoneScreens}
              deviceSpecs={activeDevice === 'watch' ? [
                { label: 'Display', value: 'OLED Always-On' },
                { label: 'Size', value: '49mm Ultra' },
                { label: 'OS', value: 'watchOS 10+' },
                { label: 'Input', value: 'Digital Crown + Haptics' },
              ] : activeDevice === 'visionpro' ? [
                { label: 'Type', value: 'Spatial Computing' },
                { label: 'OS', value: 'visionOS 1+' },
                { label: 'Input', value: 'Eye + Hand Tracking' },
                { label: 'Canvas', value: 'Infinite' },
              ] : [
                { label: 'Dynamic Island', value: 'Yes' },
                { label: 'Display', value: '6.1" OLED' },
              ]}
              colors={colors}
            />
          </div>

          {/* ── iPhone View ─────────────────────────────────────────���─── */}
          {activeDevice === 'iphone' && (
            <>
              {/* Screen tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                {iphoneScreens.map((screen) => (
                  <button key={screen.id} onClick={() => setActiveScreen(screen.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeScreen === screen.id ? '#FEC00F' : colors.cardBg, color: activeScreen === screen.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', outline: activeScreen === screen.id ? 'none' : `1px solid ${colors.border}` }}>
                    {screen.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Active large mockup */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <IPhoneFrame label={activeScreenData?.label || ''} isActive colors={colors} size="large">
                    <ActiveComponent colors={colors} />
                  </IPhoneFrame>
                  {/* Device specs */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: 'Dynamic Island', value: 'Yes' },
                      { label: 'Safe Area Top', value: '59pt' },
                      { label: 'Safe Area Bottom', value: '34pt' },
                      { label: 'Display', value: '6.1" OLED' },
                    ].map((spec) => (
                      <div key={spec.label} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px' }}>{spec.label}</span>
                        <span style={{ fontSize: '11px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gallery */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '16px' }}>ALL SCREENS</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {iphoneScreens.map((screen) => {
                      const ScreenComp = screen.component
                      return (
                        <div key={screen.id} onClick={() => setActiveScreen(screen.id)} style={{ cursor: 'pointer', borderRadius: '14px', border: `2px solid ${activeScreen === screen.id ? '#FEC00F' : colors.border}`, overflow: 'hidden', transition: 'all 0.2s ease', backgroundColor: '#000', position: 'relative' }}>
                          <div style={{ transform: 'scale(0.48)', transformOrigin: 'top left', width: '280px', height: '200px', pointerEvents: 'none' }}>
                            <ScreenComp colors={colors} />
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
                            <span style={{ fontSize: '9px', fontWeight: 600, color: activeScreen === screen.id ? '#FEC00F' : '#9E9E9E', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px' }}>{screen.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── iPad View ────────────────────────────────────────────── */}
          {activeDevice === 'ipad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>IPAD PRO 11" - SPLIT VIEW LAYOUT</h3>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>On iPad, the app uses a persistent sidebar navigation with a split-view layout. The sidebar replaces the bottom tab bar to take advantage of the larger display. Safe area insets: top 24pt, bottom 20pt. Supports Slide Over and Split View multitasking.</p>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {ipadScreens.map((screen) => {
                    const ScreenComp = screen.component
                    return (
                      <IPadFrame key={screen.id} label={screen.label} isActive colors={colors}>
                        <ScreenComp colors={colors} />
                      </IPadFrame>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Sidebar', value: 'Persistent NavigationSplitView' },
                  { label: 'Safe Area Top', value: '24pt' },
                  { label: 'Safe Area Bottom', value: '20pt' },
                  { label: 'Multitasking', value: 'Split View + Slide Over' },
                  { label: 'Pointer', value: 'Trackpad / Apple Pencil' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Mac View ─────────────────────────────────────────────── */}
          {activeDevice === 'mac' && (
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>MAC CATALYST / DESIGNED FOR IPAD</h3>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>The Mac version runs via Mac Catalyst or "Designed for iPad", inheriting the iPad split-view layout with macOS window chrome. Hover over the traffic light buttons and explore the menu bar strip. Supports keyboard shortcuts (Cmd+K), menu bar integration, and native macOS window management.</p>
              <MacFrame label="DASHBOARD - MAC CATALYST" colors={colors}>
                <MacDashboardMockup colors={colors} />
              </MacFrame>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
                {[
                  { label: 'Window Chrome', value: 'Traffic lights + title bar' },
                  { label: 'Menu Bar', value: 'File, Edit, View, Window, Help' },
                  { label: 'Keyboard', value: 'Full shortcuts (Cmd+K)' },
                  { label: 'Minimum Size', value: '1024 x 768' },
                  { label: 'Hover States', value: '.hoverEffect() modifier' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Apple Watch View ──────────────────────────────────────── */}
          {activeDevice === 'watch' && (
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>APPLE WATCH ULTRA - WATCHOS 10+</h3>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>Companion watchOS app providing quick portfolio glances, real-time trading signal notifications, watch face complications showing live P&L, and Siri-powered voice input to ask Yang questions directly from your wrist. Designed for the 49mm Apple Watch Ultra with OLED Always-On display and haptic feedback.</p>

              {/* Watch screen selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
                {[
                  { id: 'complication', label: 'COMPLICATION' },
                  { id: 'glance', label: 'QUICK GLANCE' },
                  { id: 'notification', label: 'NOTIFICATION' },
                  { id: 'dictation', label: 'VOICE INPUT' },
                ].map((s) => (
                  <button key={s.id} onClick={() => setActiveWatchScreen(s.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: activeWatchScreen === s.id ? '#FEC00F' : colors.cardBg, color: activeWatchScreen === s.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: activeWatchScreen === s.id ? 'none' : `1px solid ${colors.border}` }}>
                    {s.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Active watch mockup */}
                <AppleWatchFrame label={activeWatchScreen.toUpperCase()} isActive colors={colors}>
                  {activeWatchScreen === 'complication' && <WatchComplicationMockup />}
                  {activeWatchScreen === 'glance' && <WatchGlanceMockup />}
                  {activeWatchScreen === 'notification' && <WatchNotificationMockup />}
                  {activeWatchScreen === 'dictation' && <WatchDictationMockup />}
                </AppleWatchFrame>

                {/* All watch screens gallery */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '12px' }}>ALL WATCH SCREENS</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'complication', label: 'Complication', comp: WatchComplicationMockup },
                      { id: 'glance', label: 'Quick Glance', comp: WatchGlanceMockup },
                      { id: 'notification', label: 'Notification', comp: WatchNotificationMockup },
                      { id: 'dictation', label: 'Voice Input', comp: WatchDictationMockup },
                    ].map((s) => {
                      const Comp = s.comp
                      return (
                        <div key={s.id} onClick={() => setActiveWatchScreen(s.id)} style={{ cursor: 'pointer' }}>
                          <AppleWatchFrame label={s.label} isActive={activeWatchScreen === s.id} colors={colors}>
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'center center', width: '100%', height: '100%', pointerEvents: 'none' }}>
                              <Comp />
                            </div>
                          </AppleWatchFrame>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '28px' }}>
                {[
                  { label: 'Display', value: 'OLED Always-On' },
                  { label: 'Size', value: '49mm Ultra' },
                  { label: 'OS', value: 'watchOS 10+' },
                  { label: 'Input', value: 'Digital Crown + Haptics' },
                  { label: 'Connectivity', value: 'Bluetooth + LTE' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Vision Pro View ───────────────────────────────────────── */}
          {activeDevice === 'visionpro' && (
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.textMuted, letterSpacing: '1px', marginBottom: '4px' }}>APPLE VISION PRO - VISIONOS 1+</h3>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>Spatial computing app with floating window panels, eye tracking for navigation, hand gesture input, and an infinite canvas for data visualization. The dashboard features multiple floating panels in a 3D-layered perspective. Chat uses immersive spatial mode with voice and gesture input. Data visualization leverages depth for equity curves and 3D chart exploration.</p>

              {/* Vision Pro screen selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
                {[
                  { id: 'dashboard', label: 'SPATIAL DASHBOARD' },
                  { id: 'chat', label: 'IMMERSIVE CHAT' },
                  { id: 'dataviz', label: '3D DATA VIZ' },
                ].map((s) => (
                  <button key={s.id} onClick={() => setActiveVPScreen(s.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeVPScreen === s.id ? '#FEC00F' : colors.cardBg, color: activeVPScreen === s.id ? '#0A0A0B' : colors.textMuted, fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease', outline: activeVPScreen === s.id ? 'none' : `1px solid ${colors.border}` }}>
                    {s.label}
                  </button>
                ))}
              </div>

              <VisionProFrame label={activeVPScreen === 'dashboard' ? 'SPATIAL DASHBOARD' : activeVPScreen === 'chat' ? 'IMMERSIVE CHAT' : '3D DATA VISUALIZATION'} isActive colors={colors}>
                {activeVPScreen === 'dashboard' && <VisionProDashboardMockup colors={colors} />}
                {activeVPScreen === 'chat' && <VisionProChatMockup colors={colors} />}
                {activeVPScreen === 'dataviz' && <VisionProDataVizMockup colors={colors} />}
              </VisionProFrame>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '28px' }}>
                {[
                  { label: 'Platform', value: 'Spatial Computing' },
                  { label: 'OS', value: 'visionOS 1+' },
                  { label: 'Input', value: 'Eye + Hand Tracking' },
                  { label: 'Canvas', value: 'Infinite spatial' },
                  { label: 'Audio', value: 'Spatial Audio' },
                  { label: 'Framework', value: 'RealityKit + SwiftUI' },
                ].map((spec) => (
                  <div key={spec.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '9px', color: colors.textMuted, display: 'block', letterSpacing: '0.5px', marginBottom: '4px' }}>{spec.label}</span>
                    <span style={{ fontSize: '12px', color: colors.text, fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 2: SwiftUI Translation Guide ───────────────────── */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BookOpen size={22} color="#FEC00F" />
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '28px', fontWeight: 700, color: colors.text, letterSpacing: '1.5px', margin: 0 }}>SWIFTUI TRANSLATION GUIDE</h2>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '14px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '700px' }}>
            Step-by-step instructions for rewriting each JavaScript/React component into native SwiftUI. Covers project architecture, component mapping, authentication, navigation, AI chat streaming, theming, state management, networking, multi-device layout, and deployment.
          </p>

          {/* 1 - Project Architecture */}
          <CollapsibleSection title="1. PROJECT ARCHITECTURE" defaultOpen colors={colors} badge="FOUNDATION">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The existing Next.js app uses a context-based architecture with protected routes, a sidebar layout, and page-level components. Map this to SwiftUI using the MVVM pattern with an App {'>'} Scene {'>'} View hierarchy. Targets: iOS 17+, iPadOS 17+, macOS 14+ (Catalyst).
            </p>
            <CodeSnippet title="Xcode Project Structure" language="swift" colors={colors} code={`// AnalystApp/
├── App/
│   ├── AnalystApp.swift          // @main App entry (replaces layout.tsx)
│   └── ContentView.swift         // Root navigation (replaces ProtectedRoute + MainLayout)
├── Models/
│   ├── User.swift                // User model (from AuthContext)
│   ├── Conversation.swift        // Chat types (from types/api.ts)
│   ├── Document.swift            // Knowledge base types
│   └── BacktestResult.swift      // Backtest types
├── ViewModels/
│   ├── AuthViewModel.swift       // Auth state (replaces AuthContext)
│   ├── ChatViewModel.swift       // Chat logic (replaces useAIChat hook)
│   ├── AFLViewModel.swift        // AFL generation (replaces useChat in AFLPage)
│   ├── KnowledgeViewModel.swift  // Doc management (replaces KnowledgeBasePage state)
│   └── SettingsViewModel.swift   // Settings (replaces SettingsPage state)
├── Views/
│   ├── Splash/
│   │   └── SplashView.swift      // App launch screen with logo + loading
│   ├── Auth/
│   │   ├── LoginView.swift       // LoginPage.tsx → SwiftUI
│   │   ├── RegisterView.swift    // RegisterPage.tsx → SwiftUI
│   │   └── ForgotPasswordView.swift
│   ├── Dashboard/
│   │   └── DashboardView.swift   // DashboardPage.tsx → SwiftUI
│   ├── Chat/
│   │   ├── ChatView.swift        // ChatPage.tsx → SwiftUI
│   │   ├── MessageBubble.swift   // AI message rendering
│   │   └── ToolCardView.swift    // Generative UI cards
│   ├── AFL/
│   │   ├── AFLGeneratorView.swift
│   │   └── CodeEditorView.swift  // Monaco → native code editor
│   ├── Knowledge/
│   │   └── KnowledgeBaseView.swift
│   ├── Backtest/
│   │   └── BacktestView.swift
│   ├── Content/
│   │   └── ContentView.swift
│   └── Settings/
│       └── SettingsView.swift
├── Services/
│   ├── APIClient.swift           // Replaces src/lib/api.ts
│   ├── AuthService.swift         // Token management
│   └── StreamingService.swift    // SSE streaming for AI chat
├── Theme/
│   ├── AppTheme.swift            // Replaces ThemeContext
│   ├── Colors.swift              // Brand color constants
│   └── Typography.swift          // Rajdhani + Quicksand fonts
└── Utilities/
    ├── KeychainManager.swift     // Replaces localStorage for tokens
    └── Logger.swift              // Replaces src/lib/logger.ts`} />
          </CollapsibleSection>

          {/* 2 - Component Mapping */}
          <CollapsibleSection title="2. COMPONENT MAPPING TABLE" defaultOpen colors={colors} badge="CORE">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Direct mappings between existing React/Next.js components and their SwiftUI equivalents.</p>
            <div style={{ overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                <span style={{ color: '#FEC00F' }}>REACT / NEXT.JS</span>
                <span style={{ color: '#8ddb8c' }}>SWIFTUI EQUIVALENT</span>
                <span style={{ color: colors.textMuted }}>NOTES</span>
              </div>
              <MappingRow jsComponent="MainLayout.tsx" swiftUI="TabView + NavigationStack" notes="Replace sidebar nav with native iOS TabView for bottom navigation. Use NavigationStack for push/pop within each tab." colors={colors} />
              <MappingRow jsComponent="AuthContext.tsx" swiftUI="@Observable AuthViewModel" notes="Use Swift @Observable macro + @Environment injection. Store tokens in Keychain, not UserDefaults." colors={colors} />
              <MappingRow jsComponent="ThemeContext.tsx" swiftUI="@AppStorage + .preferredColorScheme" notes="Use iOS system appearance. Store preference in @AppStorage. Apply .tint(.potomacYellow) globally." colors={colors} />
              <MappingRow jsComponent="useChat (AI SDK)" swiftUI="AsyncStream + URLSession" notes="Replace AI SDK streaming with native URLSession SSE parsing. Use AsyncStream for reactive updates." colors={colors} />
              <MappingRow jsComponent="Monaco Editor" swiftUI="TextEditor + syntax highlighting" notes="Use native TextEditor with custom AttributedString styling, or integrate Runestone/CodeEditor package." colors={colors} />
              <MappingRow jsComponent="PromptInput" swiftUI="TextField + .toolbar" notes="Use TextField with .toolbar for action buttons. Support .submitLabel(.send) for keyboard submit." colors={colors} />
              <MappingRow jsComponent="Sonner toasts" swiftUI=".alert() / custom overlay" notes="Use SwiftUI .alert() modifier or build custom toast overlay with .transition(.move(edge: .top))." colors={colors} />
              <MappingRow jsComponent="lucide-react icons" swiftUI="SF Symbols" notes="Map each Lucide icon to its SF Symbols equivalent. SF Symbols provide native adaptive rendering." colors={colors} />
              <MappingRow jsComponent="localStorage" swiftUI="@AppStorage / Keychain" notes="Use @AppStorage for preferences, KeychainManager for sensitive data (tokens, API keys)." colors={colors} />
              <MappingRow jsComponent="useResponsive hook" swiftUI="GeometryReader / sizeClass" notes="Use native size classes for adaptive layout. GeometryReader for precise measurements." colors={colors} />
              <MappingRow jsComponent="apiClient (fetch)" swiftUI="URLSession + async/await" notes="Use URLSession with async/await. Create typed APIClient actor for thread-safe network calls." colors={colors} />
              <MappingRow jsComponent="React.useState" swiftUI="@State / @Binding" notes="@State for local view state, @Binding for child to parent communication." colors={colors} />
              <MappingRow jsComponent="React.useEffect" swiftUI=".task / .onChange" notes=".task for async on-appear work, .onChange(of:) for value-change reactions." colors={colors} />
              <MappingRow jsComponent="React.useRef" swiftUI="@FocusState / ScrollViewProxy" notes="Use @FocusState for input focus, ScrollViewProxy for scroll control." colors={colors} />
            </div>
          </CollapsibleSection>

          {/* 3 - Splash & App Launch */}
          <CollapsibleSection title="3. SPLASH SCREEN & APP LAUNCH" colors={colors} badge="LAUNCH">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              iOS apps require a LaunchScreen.storyboard for the system splash and an optional animated splash view. The Analyst app displays the Potomac logo with an animated loading bar during auth check.
            </p>
            <CodeSnippet title="AnalystApp.swift" language="swift" colors={colors} code={`import SwiftUI

@main
struct AnalystApp: App {
    // Create observable instances at app level
    @State private var authViewModel = AuthViewModel()
    @State private var settingsViewModel = SettingsViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authViewModel)
                .environment(settingsViewModel)
                .tint(.potomacYellow) // Global accent
                .task { await authViewModel.checkAuth() }
        }
    }
}`} />
            <CodeSnippet title="SplashView.swift" language="swift" colors={colors} code={`struct SplashView: View {
    @State private var shimmerOffset: CGFloat = -1

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Radial glow behind logo
            RadialGradient(
                colors: [Color.potomacYellow.opacity(0.08), .clear],
                center: .center,
                startRadius: 0,
                endRadius: 150
            )

            VStack(spacing: 20) {
                // Logo from Assets catalog
                Image("potomac-icon")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: .potomacYellow.opacity(0.2), radius: 16)

                VStack(spacing: 6) {
                    Text("ANALYST")
                        .font(.rajdhani(28, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(6)

                    Text("BY POTOMAC")
                        .font(.quicksand(10, weight: .semibold))
                        .foregroundStyle(.potomacYellow)
                        .tracking(5)
                }

                // Animated loading bar
                Capsule()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 50, height: 3)
                    .overlay(alignment: .leading) {
                        Capsule()
                            .fill(Color.potomacYellow)
                            .frame(width: 25, height: 3)
                            .offset(x: shimmerOffset * 50)
                    }
                    .clipShape(Capsule())
                    .padding(.top, 20)
            }

            // Version text
            VStack {
                Spacer()
                Text("VERSION 1.0")
                    .font(.quicksand(9))
                    .foregroundStyle(.gray.opacity(0.5))
                    .tracking(2)
                    .padding(.bottom, 50)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                shimmerOffset = 1
            }
        }
    }
}`} />
          </CollapsibleSection>

          {/* 4 - Authentication */}
          <CollapsibleSection title="4. AUTHENTICATION FLOW" colors={colors} badge="AUTH">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The existing AuthContext manages login, registration, and token storage. In SwiftUI, use an @Observable AuthViewModel with Keychain-backed token persistence and Face ID support.
            </p>
            <CodeSnippet title="AuthViewModel.swift" language="swift" colors={colors} code={`import SwiftUI
import Observation
import LocalAuthentication

@Observable
final class AuthViewModel {
    var user: User?
    var isAuthenticated: Bool { user != nil }
    var isLoading = true
    var error: String?

    private let apiClient: APIClient
    private let keychain: KeychainManager

    init(apiClient: APIClient = .shared, keychain: KeychainManager = .shared) {
        self.apiClient = apiClient
        self.keychain = keychain
    }

    // Replaces: AuthContext.checkAuth()
    func checkAuth() async {
        guard let token = keychain.get("auth_token") else {
            isLoading = false
            return
        }
        do {
            let userData = try await apiClient.getCurrentUser(token: token)
            await MainActor.run { self.user = userData }
        } catch {
            keychain.delete("auth_token")
        }
        await MainActor.run { isLoading = false }
    }

    // Replaces: AuthContext.login()
    func login(email: String, password: String) async throws {
        let response = try await apiClient.login(email: email, password: password)
        keychain.set(response.accessToken, forKey: "auth_token")
        await MainActor.run { self.user = response.user }
    }

    // Face ID / Touch ID (iOS-only feature)
    func authenticateWithBiometrics() async throws {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw AuthError.biometricsUnavailable
        }
        let success = try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Sign in to Analyst"
        )
        if success, let token = keychain.get("auth_token") {
            let userData = try await apiClient.getCurrentUser(token: token)
            await MainActor.run { self.user = userData }
        }
    }

    func logout() {
        keychain.delete("auth_token")
        user = nil
    }
}`} />
            <CodeSnippet title="LoginView.swift" language="swift" colors={colors} code={`struct LoginView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @FocusState private var focusedField: Field?

    enum Field { case email, password }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Brand section (matches mockup splash area)
                VStack(spacing: 14) {
                    Image("potomac-icon")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(color: .potomacYellow.opacity(0.15), radius: 12)

                    VStack(spacing: 4) {
                        Text("ANALYST")
                            .font(.rajdhani(24, weight: .bold))
                            .tracking(4)
                        Text("BY POTOMAC")
                            .font(.quicksand(10, weight: .semibold))
                            .foregroundStyle(.potomacYellow)
                            .tracking(5)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 48)

                // Form
                VStack(spacing: 20) {
                    Text("WELCOME BACK")
                        .font(.rajdhani(28, weight: .bold))
                        .tracking(2)

                    VStack(spacing: 16) {
                        LabeledField("EMAIL ADDRESS") {
                            TextField("you@example.com", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .focused($focusedField, equals: .email)
                        }

                        LabeledField("PASSWORD") {
                            HStack {
                                Group {
                                    if showPassword {
                                        TextField("Password", text: $password)
                                    } else {
                                        SecureField("Password", text: $password)
                                    }
                                }
                                .focused($focusedField, equals: .password)

                                Button { showPassword.toggle() } label: {
                                    Image(systemName: showPassword ? "eye.slash" : "eye")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }

                    // Sign in button
                    Button {
                        Task { await handleLogin() }
                    } label: {
                        HStack(spacing: 10) {
                            if isLoading {
                                ProgressView().tint(.black)
                            } else {
                                Image(systemName: "arrow.right.circle.fill")
                            }
                            Text("SIGN IN")
                                .font(.rajdhani(14, weight: .bold))
                                .tracking(1)
                        }
                        .frame(maxWidth: .infinity, minHeight: 52)
                    }
                    .buttonStyle(.potomacPrimary)
                    .disabled(isLoading)

                    // Face ID button
                    Button {
                        Task { try? await auth.authenticateWithBiometrics() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "faceid")
                            Text("Sign in with Face ID")
                                .font(.quicksand(13))
                        }
                        .foregroundStyle(.secondary)
                    }
                }
                .padding(32)
            }
        }
        .submitLabel(.go)
        .onSubmit { Task { await handleLogin() } }
    }

    private func handleLogin() async {
        isLoading = true
        defer { isLoading = false }
        do { try await auth.login(email: email, password: password) }
        catch { /* Show alert */ }
    }
}`} />
          </CollapsibleSection>

          {/* 5 - Navigation */}
          <CollapsibleSection title="5. NAVIGATION ARCHITECTURE" colors={colors} badge="NAV">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The web app uses a sidebar (MainLayout.tsx) with 9 nav items. On iPhone, translate this to a TabView with 5 primary tabs. On iPad/Mac, use NavigationSplitView with a persistent sidebar matching the mockups above.
            </p>
            <CodeSnippet title="ContentView.swift (Adaptive Root Navigation)" language="swift" colors={colors} code={`struct ContentView: View {
    @Environment(AuthViewModel.self) private var auth
    @Environment(\\.horizontalSizeClass) private var sizeClass
    @State private var selectedTab: AppTab = .dashboard

    enum AppTab: String, CaseIterable {
        case dashboard, chat, afl, knowledge, more

        var title: String {
            switch self {
            case .dashboard: "Home"
            case .chat: "Chat"
            case .afl: "AFL"
            case .knowledge: "KB"
            case .more: "More"
            }
        }

        var icon: String {
            switch self {
            case .dashboard: "square.grid.2x2"
            case .chat: "message"
            case .afl: "chevron.left.forwardslash.chevron.right"
            case .knowledge: "cylinder"
            case .more: "ellipsis.circle"
            }
        }
    }

    var body: some View {
        Group {
            if auth.isLoading {
                SplashView()
            } else if auth.isAuthenticated {
                if sizeClass == .compact {
                    // iPhone: Bottom tab bar (see mockup)
                    iphoneTabView
                } else {
                    // iPad / Mac: Sidebar navigation (see iPad mockup)
                    ipadSplitView
                }
            } else {
                NavigationStack { LoginView() }
            }
        }
    }

    // iPhone layout: matches MockupTabBar with 5 tabs
    private var iphoneTabView: some View {
        TabView(selection: $selectedTab) {
            Tab(AppTab.dashboard.title, systemImage: AppTab.dashboard.icon,
                value: .dashboard) {
                NavigationStack { DashboardView() }
            }
            Tab(AppTab.chat.title, systemImage: AppTab.chat.icon,
                value: .chat) {
                NavigationStack { ChatView() }
            }
            Tab(AppTab.afl.title, systemImage: AppTab.afl.icon,
                value: .afl) {
                NavigationStack { AFLGeneratorView() }
            }
            Tab(AppTab.knowledge.title, systemImage: AppTab.knowledge.icon,
                value: .knowledge) {
                NavigationStack { KnowledgeBaseView() }
            }
            Tab(AppTab.more.title, systemImage: AppTab.more.icon,
                value: .more) {
                NavigationStack { MoreMenuView() }
            }
        }
        .tint(.potomacYellow)
    }

    // iPad / Mac layout: persistent sidebar like web sidebar
    private var ipadSplitView: some View {
        NavigationSplitView {
            SidebarView(selectedTab: $selectedTab)
                .navigationSplitViewColumnWidth(min: 200, ideal: 240, max: 300)
        } detail: {
            switch selectedTab {
            case .dashboard: DashboardView()
            case .chat: ChatView()
            case .afl: AFLGeneratorView()
            case .knowledge: KnowledgeBaseView()
            case .more: MoreMenuView()
            }
        }
        .tint(.potomacYellow)
    }
}`} />
          </CollapsibleSection>

          {/* 6 - AI Chat Streaming */}
          <CollapsibleSection title="6. AI CHAT & SSE STREAMING" colors={colors} badge="CORE">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The web app uses the AI SDK useChat hook with DefaultChatTransport for SSE streaming. On iOS, replicate this with URLSession and AsyncThrowingStream for real-time message streaming with tool call support.
            </p>
            <CodeSnippet title="StreamingService.swift" language="swift" colors={colors} code={`actor StreamingService {
    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL = URL(string: "https://potomac-analyst-workbench-production.up.railway.app")!) {
        self.baseURL = baseURL
        self.session = URLSession(configuration: .default)
    }

    // Replaces: DefaultChatTransport + useChat()
    func streamChat(
        messages: [ChatMessage],
        conversationId: String?,
        token: String
    ) -> AsyncThrowingStream<StreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                var request = URLRequest(url: baseURL.appending(path: "/api/chat"))
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")

                let body: [String: Any] = [
                    "messages": messages.map { $0.toDictionary() },
                    "conversationId": conversationId ?? NSNull()
                ]
                request.httpBody = try? JSONSerialization.data(withJSONObject: body)

                do {
                    let (bytes, _) = try await session.bytes(for: request)
                    for try await line in bytes.lines {
                        guard line.hasPrefix("data: ") else { continue }
                        let data = String(line.dropFirst(6))
                        if data == "[DONE]" { break }
                        if let event = parseSSEEvent(data) {
                            continuation.yield(event)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    private func parseSSEEvent(_ data: String) -> StreamEvent? {
        guard let jsonData = data.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any]
        else { return nil }
        if let text = json["text"] as? String { return .textDelta(text) }
        if let toolCall = json["tool_call"] as? [String: Any] {
            return .toolCall(ToolCallEvent(from: toolCall))
        }
        return nil
    }
}

enum StreamEvent {
    case textDelta(String)
    case toolCall(ToolCallEvent)
    case toolResult(ToolResultEvent)
    case source(SourceEvent)
    case finished
}`} />
            <CodeSnippet title="ChatViewModel.swift" language="swift" colors={colors} code={`@Observable
final class ChatViewModel {
    var messages: [ChatMessage] = []
    var conversations: [Conversation] = []
    var selectedConversation: Conversation?
    var isStreaming = false
    var inputText = ""

    private let streaming: StreamingService
    private let apiClient: APIClient

    // Replaces: ChatPage.doSend()
    func sendMessage() async {
        guard !inputText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let text = inputText
        inputText = ""
        isStreaming = true

        messages.append(ChatMessage(role: .user, content: text))
        messages.append(ChatMessage(role: .assistant, content: ""))

        do {
            let token = KeychainManager.shared.get("auth_token") ?? ""
            let stream = streaming.streamChat(
                messages: messages,
                conversationId: selectedConversation?.id,
                token: token
            )
            for try await event in stream {
                await MainActor.run {
                    switch event {
                    case .textDelta(let text):
                        if let last = messages.indices.last {
                            messages[last].content += text
                        }
                    case .toolCall(let tool):
                        messages[messages.count - 1].toolCalls.append(tool)
                    default: break
                    }
                }
            }
        } catch {
            await MainActor.run { self.messages.removeLast() }
        }
        await MainActor.run { isStreaming = false }
    }
}`} />
          </CollapsibleSection>

          {/* 7 - Theme & Styling */}
          <CollapsibleSection title="7. THEME, TYPOGRAPHY & STYLING" colors={colors} badge="UI">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              Translate the web app color system (globals.css + ThemeContext) to SwiftUI Color extensions and custom ViewModifiers. Register Rajdhani and Quicksand fonts in Info.plist.
            </p>
            <CodeSnippet title="Colors.swift" language="swift" colors={colors} code={`import SwiftUI

extension Color {
    // Potomac Brand Colors (from globals.css --potomac-*)
    static let potomacYellow = Color(hex: "FEC00F")
    static let potomacGray   = Color(hex: "212121")
    static let potomacTurquoise = Color(hex: "00DED1")
    static let potomacPink   = Color(hex: "EB2F5C")

    // Surface colors (from MainLayout colors object)
    static let surfacePrimary   = Color("SurfacePrimary")    // dark: #121212, light: #fff
    static let surfaceSecondary = Color("SurfaceSecondary")  // dark: #1E1E1E, light: #f8f9fa
    static let surfaceInput     = Color("SurfaceInput")      // dark: #262626, light: #f8f8f8
    static let borderDefault    = Color("BorderDefault")     // dark: #2E2E2E, light: #e5e5e5

    init(hex: String) {
        let scanner = Scanner(string: hex)
        var hexNumber: UInt64 = 0
        scanner.scanHexInt64(&hexNumber)
        self.init(
            .sRGB,
            red: Double((hexNumber & 0xFF0000) >> 16) / 255,
            green: Double((hexNumber & 0x00FF00) >> 8) / 255,
            blue: Double(hexNumber & 0x0000FF) / 255
        )
    }
}

// Custom font helpers
extension Font {
    static func rajdhani(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .custom("Rajdhani", size: size).weight(weight)
    }
    static func quicksand(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Quicksand", size: size).weight(weight)
    }
}

// Primary gold button style
struct PotomacPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.rajdhani(14, weight: .bold))
            .foregroundStyle(.black)
            .background(Color.potomacYellow)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .opacity(configuration.isPressed ? 0.8 : 1)
            .shadow(color: .potomacYellow.opacity(0.3), radius: 8, y: 4)
    }
}

extension ButtonStyle where Self == PotomacPrimaryButtonStyle {
    static var potomacPrimary: PotomacPrimaryButtonStyle { .init() }
}`} />
          </CollapsibleSection>

          {/* 8 - State Management */}
          <CollapsibleSection title="8. STATE MANAGEMENT PATTERNS" colors={colors} badge="DATA">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The web app uses React contexts (AuthContext, ThemeContext, TabContext, FontSizeContext) and local useState hooks. Translate these to SwiftUI&apos;s Observation framework.
            </p>
            <div style={{ overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', padding: '12px 0', borderBottom: '2px solid rgba(254,192,15,0.3)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', fontFamily: "'Rajdhani', sans-serif" }}>
                <span style={{ color: '#FEC00F' }}>REACT PATTERN</span>
                <span style={{ color: '#8ddb8c' }}>SWIFTUI PATTERN</span>
                <span style={{ color: colors.textMuted }}>MIGRATION NOTES</span>
              </div>
              <MappingRow jsComponent="createContext + useContext" swiftUI="@Observable + @Environment" notes="Create @Observable classes, inject via .environment() at app root." colors={colors} />
              <MappingRow jsComponent="useState" swiftUI="@State" notes="Direct 1:1 mapping. Triggers re-render on change." colors={colors} />
              <MappingRow jsComponent="useEffect([], [])" swiftUI=".task { } / .onAppear" notes=".task for async on-appear. Auto-cancelled on disappear." colors={colors} />
              <MappingRow jsComponent="useEffect(dep)" swiftUI=".onChange(of: dep)" notes="Replaces effects that watch specific dependencies." colors={colors} />
              <MappingRow jsComponent="useRef" swiftUI="@State (non-rendering)" notes="For non-rendering refs, use plain properties on ViewModel." colors={colors} />
              <MappingRow jsComponent="useCallback" swiftUI="Not needed" notes="SwiftUI handles view identity and diffing natively." colors={colors} />
              <MappingRow jsComponent="useMemo" swiftUI="Computed property" notes="Use computed properties on @Observable. Cached automatically." colors={colors} />
              <MappingRow jsComponent="localStorage" swiftUI="@AppStorage / Keychain" notes="@AppStorage for UserDefaults preferences. Keychain for secrets." colors={colors} />
            </div>
          </CollapsibleSection>

          {/* 9 - API Client */}
          <CollapsibleSection title="9. API CLIENT & NETWORKING" colors={colors} badge="NETWORK">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              Replace src/lib/api.ts with a Swift actor-based API client using URLSession for type-safe networking with automatic token management.
            </p>
            <CodeSnippet title="APIClient.swift" language="swift" colors={colors} code={`actor APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "https://potomac-analyst-workbench-production.up.railway.app")!
    private let session: URLSession
    private let decoder: JSONDecoder

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await post("/api/v2/auth/login", body: ["email": email, "password": password])
    }

    func getConversations(token: String) async throws -> [Conversation] {
        try await get("/api/v2/conversations", token: token)
    }

    func getMessages(conversationId: String, token: String) async throws -> [Message] {
        try await get("/api/v2/conversations/\\(conversationId)/messages", token: token)
    }

    func uploadDocument(_ data: Data, filename: String, token: String) async throws -> Document {
        var request = URLRequest(url: baseURL.appending(path: "/api/v2/brain/upload"))
        request.httpMethod = "POST"
        request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")
        var body = Data()
        body.append("--\\(boundary)\\r\\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\\"file\\"; filename=\\"\\(filename)\\"\\r\\n".data(using: .utf8)!)
        body.append("Content-Type: application/octet-stream\\r\\n\\r\\n".data(using: .utf8)!)
        body.append(data)
        body.append("\\r\\n--\\(boundary)--\\r\\n".data(using: .utf8)!)
        request.httpBody = body
        let (responseData, _) = try await session.data(for: request)
        return try decoder.decode(Document.self, from: responseData)
    }

    private func get<T: Decodable>(_ path: String, token: String? = nil) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: path))
        if let token { request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization") }
        let (data, _) = try await session.data(for: request)
        return try decoder.decode(T.self, from: data)
    }

    private func post<T: Decodable>(_ path: String, body: [String: Any], token: String? = nil) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, _) = try await session.data(for: request)
        return try decoder.decode(T.self, from: data)
    }
}`} />
          </CollapsibleSection>

          {/* 10 - Multi-device Layout */}
          <CollapsibleSection title="10. MULTI-DEVICE LAYOUT & RESPONSIVENESS" colors={colors} badge="LAYOUT">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              The web app uses manual isMobile/isTablet breakpoints. SwiftUI provides native adaptive layout with size classes, NavigationSplitView, and ViewThatFits. The mockups above show the distinct layouts for each device.
            </p>
            <CodeSnippet title="Adaptive Layouts" language="swift" colors={colors} code={`// iPhone: Compact width → TabView + NavigationStack
// iPad: Regular width → NavigationSplitView with sidebar
// Mac: Regular width → NavigationSplitView with wider sidebar

struct AdaptiveChatView: View {
    @Environment(\\.horizontalSizeClass) private var sizeClass

    var body: some View {
        if sizeClass == .compact {
            // iPhone: full-screen chat (see Chat mockup)
            ChatMessagesView()
        } else {
            // iPad/Mac: split view with conversation list (see iPad Chat mockup)
            HStack(spacing: 0) {
                ConversationListView()
                    .frame(width: 280)
                Divider()
                ChatMessagesView()
            }
        }
    }
}

// Safe area handling is automatic in SwiftUI
// The .safeAreaInset modifier handles Dynamic Island / notch:
struct ChatInputView: View {
    var body: some View {
        ScrollView { /* messages */ }
            .safeAreaInset(edge: .bottom) {
                HStack {
                    TextField("Ask Yang...", text: .constant(""))
                    Button("Send") { }
                        .buttonStyle(.potomacPrimary)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
    }
}

// Device-specific padding for safe area insets:
// iPhone 15 Pro: top 59pt, bottom 34pt (Dynamic Island)
// iPad Pro 11": top 24pt, bottom 20pt
// Mac Catalyst: standard window chrome`} />
          </CollapsibleSection>

          {/* 11 - Icon Mapping */}
          <CollapsibleSection title="11. ICON MAPPING (LUCIDE TO SF SYMBOLS)" colors={colors} badge="ICONS">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
              Map every Lucide icon used in the codebase to its closest SF Symbols equivalent for native iOS rendering across all devices.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {[
                { lucide: 'LayoutDashboard', sf: 'square.grid.2x2' },
                { lucide: 'Code2', sf: 'chevron.left.forwardslash.chevron.right' },
                { lucide: 'MessageCircle', sf: 'message' },
                { lucide: 'Database', sf: 'cylinder' },
                { lucide: 'TrendingUp', sf: 'chart.line.uptrend.xyaxis' },
                { lucide: 'Zap', sf: 'bolt.fill' },
                { lucide: 'Settings', sf: 'gearshape' },
                { lucide: 'Sparkles', sf: 'sparkles' },
                { lucide: 'Search', sf: 'magnifyingglass' },
                { lucide: 'Upload', sf: 'arrow.up.doc' },
                { lucide: 'Trash2', sf: 'trash' },
                { lucide: 'Copy', sf: 'doc.on.doc' },
                { lucide: 'Eye / EyeOff', sf: 'eye / eye.slash' },
                { lucide: 'LogIn / LogOut', sf: 'arrow.right.circle / rectangle.portrait.and.arrow.right' },
                { lucide: 'Menu / X', sf: 'line.3.horizontal / xmark' },
                { lucide: 'Plus', sf: 'plus' },
                { lucide: 'ChevronLeft/Right', sf: 'chevron.left / chevron.right' },
                { lucide: 'Loader2', sf: 'ProgressView()' },
                { lucide: 'FileText', sf: 'doc.text' },
                { lucide: 'ArrowRight', sf: 'arrow.right' },
              ].map((item) => (
                <div key={item.lucide} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, fontSize: '12px' }}>
                  <code style={{ color: '#FEC00F', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.lucide}</code>
                  <ArrowRight size={10} color={colors.textMuted} />
                  <code style={{ color: '#8ddb8c', fontFamily: 'monospace', flex: 1, fontSize: '11px' }}>{item.sf}</code>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* 12 - Testing & Deployment */}
          <CollapsibleSection title="12. TESTING & DEPLOYMENT" colors={colors} badge="SHIP">
            <p style={{ color: colors.textMuted, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>Recommended testing strategy and deployment approach for the iOS app.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { icon: Shield, title: 'Unit Tests', desc: 'Test ViewModels with XCTest. Mock APIClient using protocol-based dependency injection. Test auth flows, message parsing, and state transitions.' },
                { icon: Monitor, title: 'UI Tests', desc: 'Use XCUITest for critical user flows: login, sending messages, uploading documents. Test both light and dark mode appearances across device sizes.' },
                { icon: Smartphone, title: 'Preview Testing', desc: 'Leverage SwiftUI Previews for rapid iteration. Create preview fixtures for every screen matching the mockups on this page.' },
                { icon: GitBranch, title: 'CI/CD Pipeline', desc: 'Use Xcode Cloud or Fastlane for automated builds. Deploy to TestFlight for beta testing, then App Store Connect for production submission.' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} style={{ padding: '20px', borderRadius: '14px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(254,192,15,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Icon size={20} color="#FEC00F" />
                    </div>
                    <h4 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 600, color: colors.text, letterSpacing: '0.5px', marginBottom: '8px' }}>{item.title}</h4>
                    <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer style={{ padding: '32px 0', borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted }}>Potomac Analyst Workbench - Apple Developer Blueprint v3.0 (iPhone, iPad, Mac, Watch, Vision Pro)</p>
        </footer>
      </div>
    </div>
  )
}

export default DeveloperPage
