import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Download,
  Copy,
  Trash2,
  Eye,
  Settings,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  User,
  Paperclip,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Database,
  Calculator,
  Target,
  Sun,
  Moon,
  Book,
  Lightbulb,
  BarChart3,
  Folder,
  Info,
  Filter,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Share2,
  Star,
  Heart,
  Bookmark,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Activity,
  DollarSign,
  Percent,
  TrendingDown,
  AlertTriangle,
  FileText,
  Image,
  Code,
  Lock,
  Unlock,
  GitBranch,
  Layers,
  PieChart,
  BarChart2,
  LineChart as LineChartIcon,
  Zap,
  Shield,
  Globe,
  Crosshair,
  Move,
  RotateCcw
} from 'lucide-react';

// Import Potomac logos
import logoFull from 'figma:asset/b6f4dd51f4a6c34cb4d10bae287dadeedec5a8d0.png';
import logoIconYellow from 'figma:asset/5ce167767639106e26c3015beb74a7ba651e69bf.png';
import logoIconBlack from 'figma:asset/d24c5ff124bb0ac606d4e26646d856d125b21d37.png';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [splashVisible, setSplashVisible] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  // Sample chart data
  const chartData = [
    { month: 'Jan', value: 4200, change: 5.2 },
    { month: 'Feb', value: 4800, change: 14.3 },
    { month: 'Mar', value: 4500, change: -6.3 },
    { month: 'Apr', value: 5200, change: 15.6 },
    { month: 'May', value: 5800, change: 11.5 },
    { month: 'Jun', value: 6200, change: 6.9 }
  ];

  return (
    <div className={darkMode ? 'bg-[#121212] min-h-screen' : 'bg-white min-h-screen'}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-[#424242] bg-[#1E1E1E]' : 'border-[#BDBDBD] bg-white'} sticky top-0 z-50`}>
        <div className="max-w-[1920px] mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className={`font-['Rajdhani'] text-[32px] font-bold tracking-wider ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
              POTOMAC UI DESIGN KIT
            </h1>
            <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
              Comprehensive design system for Analyst by Potomac Fund Management
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-lg border border-[#BDBDBD] hover:border-[#FEC00F] transition-all"
          >
            {darkMode ? <Sun className="w-5 h-5 text-[#FFD740]" /> : <Moon className="w-5 h-5 text-[#757575]" />}
          </button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-8 py-12">
        {/* Introduction */}
        <section className="mb-16">
          <p className={`font-['Quicksand'] text-[15px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'} max-w-4xl leading-relaxed`}>
            Complete design system for Analyst by Potomac Fund Management. This kit includes all visual components, typography, colors, interactive elements, charting components, data visualizations, and specialized UI elements for financial analysis, reverse engineering, market overview, and trading strategy development. Developed by Sohaib Ali.
          </p>
        </section>

        {/* BRAND LOGOS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            BRAND LOGOS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Full Logo */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                FULL LOGO
              </h3>
              <div className="bg-white p-8 rounded-lg mb-4 flex items-center justify-center min-h-[120px]">
                <img src={logoFull} alt="Potomac Full Logo" className="max-w-full h-auto" />
              </div>
              <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Primary logo for headers and marketing materials
              </p>
            </div>

            {/* Icon Yellow */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                ICON - YELLOW
              </h3>
              <div className="bg-white p-8 rounded-lg mb-4 flex items-center justify-center min-h-[120px]">
                <img src={logoIconYellow} alt="Potomac Icon Yellow" className="w-24 h-24" />
              </div>
              <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Icon for app branding and favicons
              </p>
            </div>

            {/* Icon Black */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                ICON - BLACK
              </h3>
              <div className="bg-white p-8 rounded-lg mb-4 flex items-center justify-center min-h-[120px]">
                <img src={logoIconBlack} alt="Potomac Icon Black" className="w-24 h-24" />
              </div>
              <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Monochrome version for print and minimal designs
              </p>
            </div>
          </div>

          {/* Logo Usage Guidelines */}
          <div className={`rounded-xl p-6 mt-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-[#EEEEEE] border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
              LOGO USAGE GUIDELINES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'} mb-2 font-semibold`}>
                  Minimum Size
                </p>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                  Full logo: 120px width minimum • Icon: 32px × 32px minimum
                </p>
              </div>
              <div>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'} mb-2 font-semibold`}>
                  Clear Space
                </p>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                  Maintain minimum 20px clear space around all sides
                </p>
              </div>
              <div>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'} mb-2 font-semibold`}>
                  Background Colors
                </p>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                  Use yellow icon on dark backgrounds • Use black icon on light backgrounds
                </p>
              </div>
              <div>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'} mb-2 font-semibold`}>
                  Restrictions
                </p>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                  Do not distort, rotate, or modify colors • Maintain aspect ratio
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SPLASH SCREEN */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            SPLASH SCREEN & LOADING ANIMATION
          </h2>

          {/* Splash Screen Preview */}
          <div className={`rounded-xl overflow-hidden mb-8 ${darkMode ? 'border border-[#424242]' : 'border border-[#BDBDBD]'}`}>
            <div className={`p-4 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} flex items-center justify-between`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                SPLASH SCREEN PREVIEW
              </h3>
              <button 
                onClick={() => setSplashVisible(!splashVisible)}
                className="px-4 h-9 rounded-lg bg-[#FEC00F] hover:bg-[#FFD740] font-['Rajdhani'] text-[13px] font-semibold text-[#212121] transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                PREVIEW ANIMATION
              </button>
            </div>

            <div className={`relative h-[500px] flex items-center justify-center ${darkMode ? 'bg-[#121212]' : 'bg-white'} overflow-hidden`}>
              <div className="text-center relative z-10 h-full flex flex-col justify-center">
                {/* Logo Outline Tracing Animation Container */}
                <div className="mb-8 relative w-40 h-40 mx-auto overflow-visible">
                  {/* Background glow - constrained */}
                  <div className="absolute inset-0 logo-glow-bg" style={{ transform: 'scale(0.8)' }}></div>
                  
                  {/* Base logo (full brightness) - properly sized */}
                  <img 
                    src={logoIconYellow} 
                    alt="Potomac Logo Base" 
                    className="w-full h-full absolute inset-0 object-contain"
                  />
                  
                  {/* Continuously tracing outline - non-overlapping */}
                  <div className="absolute inset-0 logo-outline-container pointer-events-none">
                    <img 
                      src={logoIconYellow} 
                      alt="Potomac Logo Outline" 
                      className="w-full h-full object-contain logo-outline-trace"
                    />
                  </div>
                </div>

                <h1 className={`font-['Rajdhani'] text-[32px] font-semibold tracking-wider ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2`}
                  style={{ animation: 'fadeIn 0.7s ease-out 0.3s both' }}>
                  POTOMAC FUND MANAGEMENT
                </h1>
                <p className={`font-['Quicksand'] text-[14px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-12`}
                  style={{ animation: 'fadeIn 0.7s ease-out 0.5s both' }}>
                  Analyst Platform
                </p>

                {/* Loading Bar with Neon Electric Effect */}
                <div className="w-60 mx-auto mb-20 relative"
                  style={{ animation: 'fadeIn 0.7s ease-out 0.7s both' }}>
                  {/* Neon Progress Bar Container */}
                  <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden relative border border-[#424242]">
                    {/* Main progress bar with neon effect */}
                    <div 
                      className="h-full neon-progress rounded-full relative"
                      style={{ animation: 'loadProgress 3.5s ease-out forwards' }}
                    >
                      {/* Electric trail effect */}
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 overflow-visible">
                        <div className="electric-spark"></div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Display */}
                  <div className="mt-3 text-center">
                    <span className="neon-text font-['Rajdhani'] text-[13px] font-bold tracking-wider">
                      LOADING...
                    </span>
                  </div>
                </div>

                {/* Footer Text */}
                <div className="absolute bottom-8 left-0 right-0 text-center"
                  style={{ animation: 'fadeIn 0.7s ease-out 0.9s both' }}>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#757575]' : 'text-[#BDBDBD]'}`}>
                    © 2025 POTOMAC FUND MANAGEMENT
                  </p>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#757575]' : 'text-[#BDBDBD]'} mt-1`}>
                    DEVELOPED BY SOHAIB ALI
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Animation Specifications */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
              ANIMATION TIMELINE
            </h3>
            
            <div className="space-y-3">
              {[
                { time: '0-600ms', action: 'Logo scales in (0.9 to 1.0) with fade' },
                { time: '600-1200ms', action: 'Company name fades in' },
                { time: '1200-2000ms', action: 'Loading bar animates (0-70% progress)' },
                { time: '2000-4500ms', action: 'Loading completes to 100%' },
                { time: '4500-5000ms', action: 'Brief pause before transition' },
                { time: '5000-5400ms', action: 'Fade out all elements' },
                { time: '5400ms+', action: 'Main app renders with fade-in' }
              ].map((step) => (
                <div key={step.time} className={`p-3 rounded-lg ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} flex items-start gap-3`}>
                  <span className={`font-['Rajdhani'] text-[13px] font-bold text-[#FEC00F] min-w-[120px]`}>
                    {step.time}
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    {step.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SETUP WIZARD */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            SETUP WIZARD UI KIT
          </h2>

          {/* Setup Progress Bar */}
          <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                STEP NAVIGATION
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => setSetupStep(step)}
                    className={`px-3 py-1 rounded-md font-['Rajdhani'] text-[12px] font-semibold transition-all ${
                      setupStep === step
                        ? 'bg-[#FEC00F] text-[#212121]'
                        : darkMode ? 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]' : 'bg-[#EEEEEE] text-[#757575] hover:bg-[#E0E0E0]'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <p className={`font-['Rajdhani'] text-[12px] font-semibold ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2 tracking-wide`}>
                STEP {setupStep} OF 4
              </p>
              <div className="w-full h-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FEC00F] rounded-full transition-all duration-400"
                  style={{ width: `${setupStep * 25}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Setup Screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Step 1: Welcome */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
              <div className={`w-16 h-16 rounded-xl bg-[#FEC00F]/10 flex items-center justify-center mb-6`}>
                <Sparkles className="w-8 h-8 text-[#FEC00F]" />
              </div>
              
              <h3 className={`font-['Rajdhani'] text-[24px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-3`}>
                WELCOME TO ANALYST
              </h3>
              
              <p className={`font-['Quicksand'] text-[15px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'} leading-relaxed mb-6`}>
                Your AI-powered trading strategy toolkit, from Potomac Fund Management. Let's get you started.
              </p>

              <button className="w-full h-12 bg-[#FEC00F] hover:bg-[#FFD740] rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#212121] tracking-[0.5px] transition-all flex items-center justify-center gap-2">
                CONTINUE
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center mt-4`}>
                Takes about 2 minutes to complete
              </p>
            </div>

            {/* Step 2: Account Credentials */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
              <h3 className={`font-['Rajdhani'] text-[24px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-3`}>
                CREATE YOUR ACCOUNT
              </h3>
              
              <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-6`}>
                This information keeps your account secure and your data encrypted.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    NAME
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all outline-none`}
                  />
                </div>

                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all outline-none`}
                  />
                </div>

                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block flex items-center gap-2`}>
                    CLAUDE API KEY
                    <Info className="w-3 h-3 text-[#757575]" />
                  </label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all outline-none`}
                  />
                </div>
              </div>

              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-4`}>
                Your information is encrypted using industry-standard AES-256 encryption.
              </p>
            </div>

            {/* Step 3: Personalization */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
              <h3 className={`font-['Rajdhani'] text-[24px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-3`}>
                WHAT SHOULD WE CALL YOU?
              </h3>
              
              <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-6`}>
                This is how your AI assistant will address you.
              </p>

              <div className="mb-6">
                <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                  YOUR NAME/NICKNAME
                </label>
                <input
                  type="text"
                  placeholder="Enter a name or nickname"
                  className={`w-full h-12 px-4 rounded-lg border-2 border-[#BDBDBD] focus:border-[#FEC00F] font-['Quicksand'] text-[16px] text-center ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all outline-none`}
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} text-center`}>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'} italic`}>
                  "Hi Alex, how can I help you today?"
                </p>
              </div>
            </div>

            {/* Step 4: Appearance */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
              <h3 className={`font-['Rajdhani'] text-[24px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-3`}>
                APPEARANCE PREFERENCES
              </h3>
              
              <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-6`}>
                Choose your preferred theme.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button className={`p-4 rounded-xl border-2 ${!darkMode ? 'border-[#FEC00F] bg-[#FEC00F]/5' : 'border-[#BDBDBD]'} transition-all hover:shadow-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <Sun className="w-6 h-6 text-[#FEC00F]" />
                    <div className={`w-5 h-5 rounded-full border-2 ${!darkMode ? 'border-[#FEC00F] bg-[#FEC00F]' : 'border-[#BDBDBD]'} flex items-center justify-center`}>
                      {!darkMode && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <p className={`font-['Rajdhani'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-1`}>
                    LIGHT
                  </p>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Clean, bright interface
                  </p>
                </button>

                <button className={`p-4 rounded-xl border-2 ${darkMode ? 'border-[#FFD740] bg-[#FFD740]/5' : 'border-[#BDBDBD]'} transition-all hover:shadow-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <Moon className="w-6 h-6 text-[#FFD740]" />
                    <div className={`w-5 h-5 rounded-full border-2 ${darkMode ? 'border-[#FFD740] bg-[#FFD740]' : 'border-[#BDBDBD]'} flex items-center justify-center`}>
                      {darkMode && <Check className="w-3 h-3 text-[#212121]" />}
                    </div>
                  </div>
                  <p className={`font-['Rajdhani'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-1`}>
                    DARK
                  </p>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Easy on the eyes
                  </p>
                </button>
              </div>

              <button className="w-full h-12 bg-[#FEC00F] hover:bg-[#FFD740] rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#212121] tracking-[0.5px] transition-all flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                COMPLETE SETUP
              </button>
            </div>
          </div>

          {/* Setup Success State */}
          <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} text-center`}>
            <div className="w-16 h-16 rounded-full bg-[#FEC00F] flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="w-8 h-8 text-[#212121]" />
            </div>
            <h3 className={`font-['Rajdhani'] text-[24px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2`}>
              SETUP COMPLETE
            </h3>
            <p className={`font-['Quicksand'] text-[14px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
              Your account is ready. Redirecting to the application...
            </p>
          </div>
        </section>

        {/* COLOR PALETTE */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            COLOR PALETTE
          </h2>
          
          {/* Primary Gray Scale */}
          <div className="mb-8">
            <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
              PRIMARY GRAY SCALE
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { name: 'Gray 100%', hex: '#212121', text: 'white' },
                { name: 'Gray 80%', hex: '#424242', text: 'white' },
                { name: 'Gray 60%', hex: '#757575', text: 'white' },
                { name: 'Gray 40%', hex: '#BDBDBD', text: '#212121' },
                { name: 'Gray 20%', hex: '#EEEEEE', text: '#212121' }
              ].map((color) => (
                <div key={color.hex} className="rounded-xl overflow-hidden shadow-lg">
                  <div className="h-32" style={{ backgroundColor: color.hex }}></div>
                  <div className={`p-4 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                    <p className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                      {color.name}
                    </p>
                    <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                      {color.hex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accent and Supporting Colors */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                ACCENT YELLOW
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Primary', hex: '#FEC00F', text: '#212121' },
                  { name: 'Dark Mode', hex: '#FFD740', text: '#212121' }
                ].map((color) => (
                  <div key={color.hex} className="rounded-xl overflow-hidden shadow-lg">
                    <div className="h-32" style={{ backgroundColor: color.hex }}></div>
                    <div className={`p-4 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                      <p className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                        {color.name}
                      </p>
                      <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                        {color.hex}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                SUPPORTING COLORS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Success Green', hex: '#2D7F3E', text: 'white' },
                  { name: 'Alert Red', hex: '#DC2626', text: 'white' },
                  { name: 'Info Blue', hex: '#0052CC', text: 'white' },
                  { name: 'Neutral Light', hex: '#EEEEEE', text: '#212121' }
                ].map((color) => (
                  <div key={color.hex} className="rounded-xl overflow-hidden shadow-lg">
                    <div className="h-24" style={{ backgroundColor: color.hex }}></div>
                    <div className={`p-3 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                      <p className={`font-['Rajdhani'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                        {color.name}
                      </p>
                      <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                        {color.hex}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            TYPOGRAPHY SYSTEM
          </h2>

          <div className={`rounded-xl p-8 mb-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#EEEEEE]'}`}>
            <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
              RAJDHANI FONT (HEADERS - ALL CAPS)
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Page Title: 48px, 700 weight, +2px letter-spacing
                </p>
                <p className={`font-['Rajdhani'] text-[48px] font-bold tracking-[2px] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  GENERATE TRADING STRATEGIES
                </p>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Section Header: 28px, 600 weight, +1px letter-spacing
                </p>
                <p className={`font-['Rajdhani'] text-[28px] font-semibold tracking-[1px] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  STRATEGY ARCHITECTURE
                </p>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Subsection Header: 20px, 600 weight, +0.5px letter-spacing
                </p>
                <p className={`font-['Rajdhani'] text-[20px] font-semibold tracking-[0.5px] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  COMPONENT DETAILS
                </p>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Label: 14px, 500 weight, +0.5px letter-spacing
                </p>
                <p className={`font-['Rajdhani'] text-[14px] font-medium tracking-[0.5px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                  MARKET CONDITIONS
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#EEEEEE]'}`}>
            <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
              QUICKSAND FONT (BODY TEXT)
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Body Copy: 15px, 400 weight, 1.6 line-height
                </p>
                <p className={`font-['Quicksand'] text-[15px] leading-[1.6] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  This trading strategy combines momentum indicators with regime detection to optimize position allocation across different market conditions. The system dynamically adjusts parameters based on volatility measurements.
                </p>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Body Emphasized: 15px, 600 weight
                </p>
                <p className={`font-['Quicksand'] text-[15px] font-semibold leading-[1.6] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  Important information is displayed with increased font weight for emphasis and hierarchy.
                </p>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Small Text: 13px, 400 weight
                </p>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                  Supplementary information and metadata appear in smaller text with reduced emphasis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BUTTONS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            BUTTON COMPONENTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Buttons */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                PRIMARY BUTTONS
              </h3>
              
              <div className="space-y-4">
                <button className="w-full h-12 bg-[#FEC00F] hover:bg-[#FFD740] active:bg-[#FFA000] rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#212121] tracking-[0.5px] transition-all duration-200 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  GENERATE STRATEGY
                </button>

                <button className="w-full h-12 bg-[#FEC00F] hover:bg-[#FFD740] rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#212121] tracking-[0.5px] transition-all duration-200 flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  CONTINUE
                </button>

                <button className="w-full h-12 bg-[#BDBDBD] rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#9E9E9E] tracking-[0.5px] cursor-not-allowed">
                  DISABLED STATE
                </button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                SECONDARY BUTTONS
              </h3>
              
              <div className="space-y-4">
                <button className={`w-full h-12 bg-transparent border-[1.5px] border-[#BDBDBD] hover:border-[#FEC00F] hover:bg-[#EEEEEE] rounded-lg font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} tracking-[0.5px] transition-all duration-200 flex items-center justify-center gap-2`}>
                  <Copy className="w-4 h-4" />
                  COPY CODE
                </button>

                <button className={`w-full h-12 bg-transparent border-[1.5px] border-[#BDBDBD] hover:border-[#FEC00F] hover:bg-[#EEEEEE] rounded-lg font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} tracking-[0.5px] transition-all duration-200 flex items-center justify-center gap-2`}>
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </button>

                <button className={`w-full h-12 bg-transparent border-[1.5px] border-[#DC2626] hover:border-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg font-['Rajdhani'] text-[14px] font-semibold text-[#DC2626] tracking-[0.5px] transition-all duration-200 flex items-center justify-center gap-2`}>
                  <Trash2 className="w-4 h-4" />
                  DELETE
                </button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                ICON BUTTONS
              </h3>
              
              <div className="flex gap-4">
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#EEEEEE] transition-all duration-200">
                  <Copy className="w-5 h-5 text-[#757575] hover:text-[#FEC00F]" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#EEEEEE] transition-all duration-200">
                  <Download className="w-5 h-5 text-[#757575] hover:text-[#FEC00F]" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#EEEEEE] transition-all duration-200">
                  <Settings className="w-5 h-5 text-[#757575] hover:text-[#FEC00F]" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#EEEEEE] transition-all duration-200">
                  <Trash2 className="w-5 h-5 text-[#757575] hover:text-[#DC2626]" />
                </button>
              </div>
            </div>

            {/* Floating Action Button */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                FLOATING ACTION
              </h3>
              
              <button className="w-14 h-14 bg-[#FEC00F] hover:bg-[#FFD740] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                <ArrowRight className="w-5 h-5 text-[#212121]" />
              </button>
            </div>
          </div>
        </section>

        {/* INPUT FIELDS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            INPUT COMPONENTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Text Inputs */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                TEXT INPUTS
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    NAME
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all duration-200 outline-none`}
                  />
                </div>

                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full h-11 px-4 rounded-lg border border-[#FEC00F] ring-2 ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} outline-none`}
                  />
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-1`}>
                    Focus state shown
                  </p>
                </div>

                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all duration-200 outline-none`}
                  />
                </div>
              </div>
            </div>

            {/* Textarea & Search */}
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                TEXTAREA & SEARCH
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-2 block`}>
                    DESCRIPTION
                  </label>
                  <textarea
                    placeholder="Describe your trading strategy..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all duration-200 outline-none resize-y`}
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#757575]" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className={`w-full h-11 pl-10 pr-4 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} transition-all duration-200 outline-none`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Input States */}
          <div className={`rounded-xl p-8 mt-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
              INPUT STATES
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`font-['Quicksand'] text-[13px] font-semibold text-[#2D7F3E] mb-2 block flex items-center gap-2`}>
                  SUCCESS STATE
                  <Check className="w-4 h-4" />
                </label>
                <input
                  type="text"
                  value="valid@email.com"
                  className={`w-full h-11 px-4 rounded-lg border-2 border-[#2D7F3E] font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} outline-none`}
                  readOnly
                />
                <p className="font-['Quicksand'] text-[11px] text-[#2D7F3E] mt-1">
                  Email is valid
                </p>
              </div>

              <div>
                <label className={`font-['Quicksand'] text-[13px] font-semibold text-[#DC2626] mb-2 block flex items-center gap-2`}>
                  ERROR STATE
                  <AlertCircle className="w-4 h-4" />
                </label>
                <input
                  type="text"
                  value="invalid-email"
                  className={`w-full h-11 px-4 rounded-lg border-2 border-[#DC2626] font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-[#212121]'} outline-none`}
                  readOnly
                />
                <p className="font-['Quicksand'] text-[11px] text-[#DC2626] mt-1">
                  Please enter a valid email
                </p>
              </div>

              <div>
                <label className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-[#9E9E9E]' : 'text-[#BDBDBD]'} mb-2 block`}>
                  DISABLED STATE
                </label>
                <input
                  type="text"
                  value="Cannot edit"
                  disabled
                  className={`w-full h-11 px-4 rounded-lg border border-[#BDBDBD] font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#2A2A2A] text-[#757575]' : 'bg-[#EEEEEE] text-[#BDBDBD]'} cursor-not-allowed outline-none`}
                  readOnly
                />
              </div>
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            CARD COMPONENTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy Card */}
            <div className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${darkMode ? '' : 'border border-[#BDBDBD]'}`}>
              <div className="h-16 bg-[#FEC00F] px-4 flex items-center justify-between">
                <h3 className="font-['Rajdhani'] text-[18px] font-bold text-white tracking-wide">
                  MOMENTUM REVERSAL
                </h3>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className={`p-5 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'} leading-relaxed mb-4`}>
                  Captures short-term momentum reversals using rate-of-change and moving average divergences.
                </p>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#EEEEEE] rounded-md p-2 text-center">
                    <p className="font-['Quicksand'] text-[10px] font-semibold text-[#757575]">SHARPE</p>
                    <p className="font-['Rajdhani'] text-[16px] font-semibold text-[#212121]">1.4</p>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-md p-2 text-center">
                    <p className="font-['Quicksand'] text-[10px] font-semibold text-[#757575]">DRAWDOWN</p>
                    <p className="font-['Rajdhani'] text-[16px] font-semibold text-[#212121]">-18%</p>
                  </div>
                  <div className="bg-[#EEEEEE] rounded-md p-2 text-center">
                    <p className="font-['Quicksand'] text-[10px] font-semibold text-[#757575]">WIN RATE</p>
                    <p className="font-['Rajdhani'] text-[16px] font-semibold text-[#212121]">56%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                    Momentum
                  </span>
                  <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                    Short-term
                  </span>
                </div>
              </div>
              <div className={`px-5 py-3 flex gap-2 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
                <button className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-lg border border-[#BDBDBD] hover:border-[#FEC00F] font-['Quicksand'] text-[12px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} transition-all`}>
                  <Eye className="w-4 h-4" />
                  PREVIEW
                </button>
                <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-[#FEC00F] hover:bg-[#FFD740] font-['Quicksand'] text-[12px] font-semibold text-[#212121] transition-all">
                  <Sparkles className="w-4 h-4" />
                  GENERATE
                </button>
              </div>
            </div>

            {/* Document Card */}
            <div className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${darkMode ? '' : 'border border-[#BDBDBD]'}`}>
              <div className="h-16 bg-[#FEC00F] px-4 flex items-center gap-3">
                <Book className="w-5 h-5 text-white" />
                <h3 className="font-['Rajdhani'] text-[13px] font-semibold text-[#212121] tracking-wide truncate">
                  momentum_strategy.afl
                </h3>
              </div>
              <div className={`p-5 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                <div className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2 space-y-1`}>
                  <p>245 KB</p>
                  <p>Jan 10, 2025</p>
                </div>
                
                <div className={`font-mono text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} bg-[#F5F5F5] p-3 rounded-md max-h-16 overflow-hidden mb-3`}>
                  <code>// AFL Code Preview...</code>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[10px] text-[#757575]">
                    AFL
                  </span>
                  <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[10px] text-[#757575]">
                    Strategy
                  </span>
                </div>
              </div>
              <div className={`px-5 py-3 flex gap-2 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
                <button className={`flex-1 h-9 rounded-lg border border-[#BDBDBD] hover:border-[#FEC00F] font-['Quicksand'] text-[12px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} transition-all`}>
                  VIEW
                </button>
                <button className="flex-1 h-9 rounded-lg border border-[#DC2626] hover:bg-[#DC2626]/10 font-['Quicksand'] text-[12px] font-semibold text-[#DC2626] transition-all">
                  DELETE
                </button>
              </div>
            </div>

            {/* Metric Card */}
            <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
              <h3 className={`font-['Rajdhani'] text-[14px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                RISK SCORE
              </h3>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="#EEEEEE"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="#FEC00F"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.72)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-['Rajdhani'] text-[36px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                      72
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Sharpe Ratio
                  </span>
                  <span className={`font-['Rajdhani'] text-[14px] font-semibold text-[#2D7F3E]`}>
                    1.82
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Max Drawdown
                  </span>
                  <span className={`font-['Rajdhani'] text-[14px] font-semibold text-[#DC2626]`}>
                    -22.4%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Win Rate
                  </span>
                  <span className={`font-['Rajdhani'] text-[14px] font-semibold text-[#0052CC]`}>
                    58.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARKET OVERVIEW COMPONENTS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            MARKET OVERVIEW COMPONENTS
          </h2>

          {/* Market Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'S&P 500', value: '4,783.45', change: '+1.24%', trend: 'up', color: '#2D7F3E' },
              { label: 'DOW JONES', value: '37,440.34', change: '+0.87%', trend: 'up', color: '#2D7F3E' },
              { label: 'NASDAQ', value: '14,765.12', change: '-0.34%', trend: 'down', color: '#DC2626' },
              { label: 'VOLATILITY', value: '15.2', change: '+2.1%', trend: 'up', color: '#FFA000' }
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-5 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'} shadow-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-['Rajdhani'] text-[12px] font-semibold tracking-wide ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    {item.label}
                  </p>
                  {item.trend === 'up' ? 
                    <ArrowUp className="w-4 h-4" style={{ color: item.color }} /> :
                    <ArrowDown className="w-4 h-4" style={{ color: item.color }} />
                  }
                </div>
                <p className={`font-['Rajdhani'] text-[24px] font-bold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-1`}>
                  {item.value}
                </p>
                <p className="font-['Quicksand'] text-[13px] font-semibold" style={{ color: item.color }}>
                  {item.change}
                </p>
              </div>
            ))}
          </div>

          {/* Market Status Bar */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                MARKET STATUS
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#2D7F3E] rounded-full animate-pulse"></div>
                <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#2D7F3E]' : 'text-[#2D7F3E]'}`}>
                  Markets Open
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Trading Volume
                </p>
                <p className={`font-['Rajdhani'] text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  2.4B
                </p>
                <div className="mt-2 h-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FEC00F] rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Advancing / Declining
                </p>
                <p className={`font-['Rajdhani'] text-[20px] font-bold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  1,845 / 1,203
                </p>
                <div className="mt-2 flex gap-1">
                  <div className="h-1 bg-[#2D7F3E] rounded-full" style={{ width: '60%' }}></div>
                  <div className="h-1 bg-[#DC2626] rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <p className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                  Market Sentiment
                </p>
                <p className={`font-['Rajdhani'] text-[20px] font-bold text-[#2D7F3E]`}>
                  BULLISH
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2D7F3E]" />
                  <span className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Confidence: 72%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHARTING COMPONENTS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            CHARTING & VISUALIZATION
          </h2>

          {/* Simple Bar Chart */}
          <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                PERFORMANCE CHART
              </h3>
              <div className="flex gap-2">
                <button className={`px-3 py-1 rounded-md border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} font-['Quicksand'] text-[12px] hover:border-[#FEC00F] transition-all`}>
                  1M
                </button>
                <button className={`px-3 py-1 rounded-md bg-[#FEC00F] border border-[#FEC00F] text-[#212121] font-['Quicksand'] text-[12px] font-semibold`}>
                  6M
                </button>
                <button className={`px-3 py-1 rounded-md border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} font-['Quicksand'] text-[12px] hover:border-[#FEC00F] transition-all`}>
                  1Y
                </button>
              </div>
            </div>

            {/* Simple SVG Bar Chart */}
            <div className="relative h-64">
              <svg className="w-full h-full">
                {chartData.map((item, index) => {
                  const barHeight = (item.value / 7000) * 200;
                  const x = (index * 120) + 40;
                  const y = 200 - barHeight + 20;
                  
                  return (
                    <g key={item.month}>
                      <rect
                        x={x}
                        y={y}
                        width="80"
                        height={barHeight}
                        fill={item.change >= 0 ? '#2D7F3E' : '#DC2626'}
                        rx="4"
                      />
                      <text
                        x={x + 40}
                        y={230}
                        textAnchor="middle"
                        className={`font-['Quicksand'] text-[12px] ${darkMode ? 'fill-[#9E9E9E]' : 'fill-[#757575]'}`}
                      >
                        {item.month}
                      </text>
                      <text
                        x={x + 40}
                        y={y - 8}
                        textAnchor="middle"
                        className={`font-['Rajdhani'] text-[12px] font-semibold ${darkMode ? 'fill-white' : 'fill-[#212121]'}`}
                      >
                        ${(item.value / 1000).toFixed(1)}k
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Chart Controls */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
              CHART CONTROLS
            </h3>
            
            <div className="flex flex-wrap gap-3">
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <ZoomIn className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Zoom In</span>
              </button>
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <ZoomOut className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Zoom Out</span>
              </button>
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <Crosshair className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Crosshair</span>
              </button>
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <Move className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Pan</span>
              </button>
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <RotateCcw className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Reset</span>
              </button>
              <button className={`px-4 h-9 rounded-lg border ${darkMode ? 'border-[#424242] text-white' : 'border-[#BDBDBD] text-[#212121]'} hover:border-[#FEC00F] transition-all flex items-center gap-2`}>
                <Maximize2 className="w-4 h-4" />
                <span className="font-['Quicksand'] text-[13px]">Fullscreen</span>
              </button>
            </div>
          </div>
        </section>

        {/* REVERSE ENGINEERING COMPONENTS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            REVERSE ENGINEERING PANE
          </h2>

          {/* Flowchart Nodes */}
          <div className={`rounded-xl p-8 mb-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[20px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
              FLOWCHART NODES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Input Node */}
              <div className="flex flex-col items-center">
                <div className="w-full h-16 bg-[#E3F2FD] border-2 border-[#0052CC] rounded-xl flex items-center justify-center gap-2 px-4 hover:shadow-lg transition-all cursor-pointer">
                  <Database className="w-4 h-4 text-[#0052CC]" />
                  <span className="font-['Quicksand'] text-[12px] font-semibold text-[#0052CC]">
                    PRICE DATA
                  </span>
                </div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-2 text-center`}>
                  Input Node
                </p>
              </div>

              {/* Process Node */}
              <div className="flex flex-col items-center">
                <div className="w-full h-16 bg-[#FFF8E1] border-2 border-[#FFA000] rounded-xl flex items-center justify-center gap-2 px-4 hover:shadow-lg transition-all cursor-pointer">
                  <Calculator className="w-4 h-4 text-[#F57C00]" />
                  <span className="font-['Quicksand'] text-[12px] font-semibold text-[#F57C00]">
                    MOVING AVERAGES
                  </span>
                </div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-2 text-center`}>
                  Process Node
                </p>
              </div>

              {/* Decision Node */}
              <div className="flex flex-col items-center">
                <div className="w-full h-16 bg-[#FFE0B2] border-2 border-[#FFA000] rounded-xl flex items-center justify-center gap-2 px-4 hover:shadow-lg transition-all cursor-pointer">
                  <GitBranch className="w-4 h-4 text-[#E65100]" />
                  <span className="font-['Quicksand'] text-[12px] font-semibold text-[#E65100]">
                    REGIME CHECK
                  </span>
                </div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-2 text-center`}>
                  Decision Node
                </p>
              </div>

              {/* Output Node */}
              <div className="flex flex-col items-center">
                <div className="w-full h-16 bg-[#E8F5E9] border-2 border-[#2D7F3E] rounded-xl flex items-center justify-center gap-2 px-4 hover:shadow-lg transition-all cursor-pointer">
                  <Target className="w-4 h-4 text-[#2D7F3E]" />
                  <span className="font-['Quicksand'] text-[12px] font-semibold text-[#2D7F3E]">
                    ALLOCATION
                  </span>
                </div>
                <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-2 text-center`}>
                  Output Node
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="w-20 h-0.5 bg-[#757575]"></div>
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-[#757575]"></div>
              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                Connection Arrow (2px, Bezier curves)
              </p>
            </div>
          </div>

          {/* Component Details Panel */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
              STRATEGY COMPONENTS
            </h3>

            <div className="space-y-4">
              {/* Collapsible Section */}
              <div className={`border ${darkMode ? 'border-[#424242]' : 'border-[#BDBDBD]'} rounded-lg overflow-hidden`}>
                <button className={`w-full p-4 flex items-center justify-between ${darkMode ? 'bg-[#2A2A2A] hover:bg-[#333333]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} transition-all`}>
                  <span className={`font-['Rajdhani'] text-[13px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    INPUTS
                  </span>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-[#212121]'}`} />
                </button>
                <div className={`p-4 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                  <ul className="space-y-2">
                    {['Price Data (OHLC)', 'Trading Volume', 'Market Regime Indicator'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#FEC00F] rounded-full"></div>
                        <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={`border ${darkMode ? 'border-[#424242]' : 'border-[#BDBDBD]'} rounded-lg overflow-hidden`}>
                <button className={`w-full p-4 flex items-center justify-between ${darkMode ? 'bg-[#2A2A2A] hover:bg-[#333333]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} transition-all`}>
                  <span className={`font-['Rajdhani'] text-[13px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    PARAMETERS
                  </span>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-[#212121]'}`} />
                </button>
                <div className={`p-4 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
                  <div className="space-y-3">
                    {[
                      { name: 'Fast MA Period', value: '20' },
                      { name: 'Slow MA Period', value: '50' },
                      { name: 'RSI Period', value: '14' },
                      { name: 'Threshold', value: '0.65' }
                    ].map((param) => (
                      <div key={param.name} className={`flex items-center justify-between p-2 rounded hover:bg-[#EEEEEE]/50 transition-all`}>
                        <span className={`font-['Quicksand'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                          {param.name}
                        </span>
                        <span className={`font-['Rajdhani'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                          {param.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYSIS TOOLS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            ANALYSIS TOOLS
          </h2>

          {/* Metrics Table */}
          <div className={`rounded-xl overflow-hidden mb-8 ${darkMode ? 'border border-[#424242]' : 'border border-[#BDBDBD]'}`}>
            <div className={`p-4 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                BACKTEST METRICS
              </h3>
            </div>
            
            <div className={darkMode ? 'bg-[#1E1E1E]' : 'bg-white'}>
              {[
                { metric: 'Total Return', value: '+156.3%', color: '#2D7F3E', icon: ArrowUp },
                { metric: 'Sharpe Ratio', value: '1.82', color: '#2D7F3E', icon: TrendingUp },
                { metric: 'Max Drawdown', value: '-22.4%', color: '#DC2626', icon: ArrowDown },
                { metric: 'Win Rate', value: '58.2%', color: '#0052CC', icon: Percent },
                { metric: 'Profit Factor', value: '2.1', color: '#2D7F3E', icon: DollarSign },
                { metric: 'Consecutive Losses', value: '5', color: '#FFA000', icon: TrendingDown }
              ].map((item, index) => (
                <div 
                  key={item.metric}
                  className={`flex items-center justify-between p-4 ${index % 2 === 0 ? (darkMode ? 'bg-[#1E1E1E]' : 'bg-white') : (darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]')} hover:bg-[#FEC00F]/10 transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    <span className={`font-['Rajdhani'] text-[13px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                      {item.metric}
                    </span>
                  </div>
                  <span className="font-['Rajdhani'] text-[14px] font-bold" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#FEC00F]" />
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                AI INSIGHTS
              </h3>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} mb-4`}>
              <p className={`font-['Quicksand'] text-[14px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'} leading-relaxed`}>
                Your strategy shows strong performance with a Sharpe ratio of 1.82, which exceeds market averages. The maximum drawdown of -22.4% is within acceptable ranges relative to the total return. Consider tightening stop-loss parameters to further reduce downside risk.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-[#2D7F3E] rounded-full"></div>
                  <p className={`font-['Rajdhani'] text-[13px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    STRENGTHS
                  </p>
                </div>
                <ul className="ml-5 space-y-1">
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    • Sharpe ratio exceeds market average
                  </li>
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    • Positive profit factor indicates consistent winners
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full"></div>
                  <p className={`font-['Rajdhani'] text-[13px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    WEAKNESSES
                  </p>
                </div>
                <ul className="ml-5 space-y-1">
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    • Consecutive loss streak indicates vulnerability
                  </li>
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    • Win rate below 60% suggests room for improvement
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-[#FEC00F] rounded-full"></div>
                  <p className={`font-['Rajdhani'] text-[13px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    RECOMMENDATIONS
                  </p>
                </div>
                <ol className="ml-5 space-y-1">
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    1. Tighten stop-loss parameters to reduce max drawdown
                  </li>
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    2. Add regime filters to avoid choppy markets
                  </li>
                  <li className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#E0E0E0]' : 'text-[#424242]'}`}>
                    3. Test position sizing adjustments
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* CHAT MESSAGES */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            CHAT INTERFACE
          </h2>

          <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E] border border-[#424242]' : 'bg-white border border-[#BDBDBD]'}`}>
            <div className="space-y-4 mb-6">
              {/* Assistant Message */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#424242] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-['Rajdhani'] text-[12px] font-semibold text-white">A</span>
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} max-w-[85%]`}>
                    <p className={`font-['Quicksand'] text-[14px] ${darkMode ? 'text-white' : 'text-[#212121]'} leading-relaxed`}>
                      I'll help you create a momentum-based trading strategy. Could you tell me more about your preferred timeframe and risk tolerance?
                    </p>
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-[85%]">
                  <div className="p-3 rounded-xl bg-[#FEC00F]">
                    <p className="font-['Quicksand'] text-[14px] text-[#212121] leading-relaxed">
                      I'm looking for a short-term strategy with moderate risk, focusing on momentum reversals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assistant with Code */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#424242] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-['Rajdhani'] text-[12px] font-semibold text-white">A</span>
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} max-w-[85%]`}>
                    <p className={`font-['Quicksand'] text-[14px] ${darkMode ? 'text-white' : 'text-[#212121]'} leading-relaxed mb-3`}>
                      Here's a momentum reversal strategy for you:
                    </p>
                    <div className="bg-[#F5F5F5] p-3 rounded-md border-l-4 border-[#FEC00F] relative group">
                      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded">
                        <Copy className="w-3 h-3 text-[#757575]" />
                      </button>
                      <code className="font-mono text-[12px] text-[#212121] block">
                        FastMA = MA(Close, 20);<br />
                        SlowMA = MA(Close, 50);<br />
                        Buy = Cross(FastMA, SlowMA);
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typing Indicator */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#424242] flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-['Rajdhani'] text-[12px] font-semibold text-white">A</span>
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'} w-20`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className={`rounded-lg p-3 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
              <div className="relative">
                <textarea
                  placeholder="Describe your trading strategy..."
                  rows={3}
                  className={`w-full px-4 py-3 pr-24 rounded-lg border border-[#BDBDBD] focus:border-[#FEC00F] focus:ring-2 focus:ring-[#FEC00F]/20 font-['Quicksand'] text-[14px] ${darkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-[#212121]'} transition-all duration-200 outline-none resize-none`}
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FEC00F]/20 transition-all">
                    <Paperclip className="w-4 h-4 text-[#757575] hover:text-[#FEC00F]" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FEC00F] hover:bg-[#FFD740] transition-all">
                    <ArrowRight className="w-4 h-4 text-[#212121]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CODE DISPLAY */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            CODE DISPLAY
          </h2>

          <div className={`rounded-xl overflow-hidden ${darkMode ? 'border border-[#424242]' : 'border border-[#BDBDBD]'}`}>
            <div className={`h-10 px-4 flex items-center justify-between ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
              <span className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                AFL CODE OUTPUT
              </span>
              <div className="flex gap-2">
                <button className="px-3 h-8 flex items-center gap-2 rounded border border-[#BDBDBD] hover:border-[#FEC00F] transition-all">
                  <Copy className="w-3 h-3 text-[#757575]" />
                  <span className={`font-['Quicksand'] text-[12px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    COPY
                  </span>
                </button>
                <button className="px-3 h-8 flex items-center gap-2 rounded border border-[#BDBDBD] hover:border-[#FEC00F] transition-all">
                  <Download className="w-3 h-3 text-[#757575]" />
                  <span className={`font-['Quicksand'] text-[12px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    DOWNLOAD
                  </span>
                </button>
              </div>
            </div>
            <div className={`p-4 ${darkMode ? 'bg-[#0F1419]' : 'bg-[#F5F5F5]'} font-mono text-[13px] leading-relaxed`}>
              <div className="flex">
                <div className="w-8 text-right pr-4 select-none text-[#9E9E9E]">
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                  <div>6</div>
                  <div>7</div>
                  <div>8</div>
                  <div>9</div>
                  <div>10</div>
                </div>
                <div className="flex-1">
                  <div className={darkMode ? 'text-[#E0E0E0]' : 'text-[#212121]'}>
                    <span className="text-[#9E9E9E]">// Momentum Reversal Strategy</span><br />
                    <br />
                    <span className="text-[#0052CC]">Period</span> = <span className="text-[#D97706]">20</span>;<br />
                    <span className="text-[#0052CC]">FastMA</span> = <span className="text-[#7928CA]">MA</span>(<span className="text-[#0052CC]">Close</span>, <span className="text-[#D97706]">20</span>);<br />
                    <span className="text-[#0052CC]">SlowMA</span> = <span className="text-[#7928CA]">MA</span>(<span className="text-[#0052CC]">Close</span>, <span className="text-[#D97706]">50</span>);<br />
                    <br />
                    <span className="text-[#9E9E9E]">// Entry signals</span><br />
                    <span className="text-[#FEC00F]">Buy</span> = <span className="text-[#7928CA]">Cross</span>(<span className="text-[#0052CC]">FastMA</span>, <span className="text-[#0052CC]">SlowMA</span>);<br />
                    <span className="text-[#FEC00F]">Sell</span> = <span className="text-[#7928CA]">Cross</span>(<span className="text-[#0052CC]">SlowMA</span>, <span className="text-[#0052CC]">FastMA</span>);<br />
                    <br />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BADGES & TAGS */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            BADGES & TAGS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                STATUS BADGES
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#E8F5E9] text-[#2D7F3E] rounded-full font-['Quicksand'] text-[11px] font-semibold">
                    SUCCESS
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Positive states, completed actions
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#FFF3E0] text-[#F57C00] rounded-full font-['Quicksand'] text-[11px] font-semibold">
                    WARNING
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Caution required, pending review
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#E3F2FD] text-[#0052CC] rounded-full font-['Quicksand'] text-[11px] font-semibold">
                    INFO
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Informational, neutral state
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#EEEEEE] text-[#757575] rounded-full font-['Quicksand'] text-[11px] font-semibold">
                    NEUTRAL
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Default, no special meaning
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[16px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-6`}>
                COUNT BADGES & TAGS
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FEC00F] text-[#212121] font-['Rajdhani'] text-[12px] font-semibold flex items-center justify-center">
                    5
                  </span>
                  <span className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                    Numeric count badge
                  </span>
                </div>

                <div>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                    Strategy tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                      Momentum
                    </span>
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                      Short-term
                    </span>
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                      Moderate Risk
                    </span>
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575]">
                      AFL
                    </span>
                  </div>
                </div>

                <div>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                    Removable tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575] flex items-center gap-1">
                      Trend Following
                      <X className="w-3 h-3 cursor-pointer hover:text-[#212121]" />
                    </span>
                    <span className="px-2 py-1 bg-[#EEEEEE] rounded-full font-['Quicksand'] text-[11px] text-[#757575] flex items-center gap-1">
                      Bull Market
                      <X className="w-3 h-3 cursor-pointer hover:text-[#212121]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            NAVIGATION ELEMENTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`rounded-xl overflow-hidden ${darkMode ? 'border border-[#424242]' : 'border border-[#BDBDBD]'}`}>
              <div className={`p-4 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
                <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                  SIDEBAR TABS
                </h3>
                
                <div className="space-y-2">
                  <button className="w-full h-14 bg-[#FEC00F] border-l-4 border-l-[#FEC00F] rounded-lg px-4 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-[#212121]" />
                    <span className="font-['Rajdhani'] text-[12px] font-semibold text-[#212121] tracking-wide">
                      GENERATE
                    </span>
                  </button>

                  <button className={`w-full h-14 ${darkMode ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} rounded-lg px-4 flex items-center gap-3 transition-all`}>
                    <TrendingUp className="w-6 h-6 text-[#757575]" />
                    <div className="text-left">
                      <div className="font-['Rajdhani'] text-[11px] font-semibold text-[#757575] tracking-wide leading-tight">
                        REVERSE
                      </div>
                      <div className="font-['Rajdhani'] text-[11px] font-semibold text-[#757575] tracking-wide leading-tight">
                        ENGINEER
                      </div>
                    </div>
                  </button>

                  <button className={`w-full h-14 ${darkMode ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} rounded-lg px-4 flex items-center gap-3 transition-all`}>
                    <Lightbulb className="w-6 h-6 text-[#757575]" />
                    <span className="font-['Rajdhani'] text-[12px] font-semibold text-[#757575] tracking-wide">
                      IDEAS
                    </span>
                  </button>

                  <button className={`w-full h-14 ${darkMode ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} rounded-lg px-4 flex items-center gap-3 transition-all`}>
                    <BarChart3 className="w-6 h-6 text-[#757575]" />
                    <span className="font-['Rajdhani'] text-[12px] font-semibold text-[#757575] tracking-wide">
                      ANALYZE
                    </span>
                  </button>

                  <button className={`w-full h-14 ${darkMode ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-[#EEEEEE] hover:bg-[#E0E0E0]'} rounded-lg px-4 flex items-center gap-3 transition-all`}>
                    <Book className="w-6 h-6 text-[#757575]" />
                    <span className="font-['Rajdhani'] text-[12px] font-semibold text-[#757575] tracking-wide">
                      KNOWLEDGE
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`rounded-xl overflow-hidden ${darkMode ? 'border border-[#424242]' : 'border border-[#BDBDBD]'}`}>
              <div className={`h-16 px-6 flex items-center justify-between ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white'} border-b ${darkMode ? 'border-[#424242]' : 'border-[#BDBDBD]'}`}>
                <div className="flex items-center gap-4">
                  <Menu className="w-6 h-6 text-[#757575]" />
                  <span className={`font-['Rajdhani'] text-[18px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                    ANALYST
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="relative">
                    <Bell className="w-5 h-5 text-[#757575]" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#DC2626] rounded-full"></span>
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#424242] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </button>
                  <button>
                    <Settings className="w-5 h-5 text-[#757575] hover:text-[#FEC00F] transition-colors" />
                  </button>
                </div>
              </div>

              <div className={`p-4 ${darkMode ? 'bg-[#2A2A2A]' : 'bg-[#EEEEEE]'}`}>
                <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                  TOP NAVIGATION BAR
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* LOADING STATES */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            LOADING & PROGRESS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                PROGRESS BAR
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
                      Generating...
                    </span>
                    <span className={`font-['Quicksand'] text-[12px] ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                      72%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FEC00F] rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>

                <div>
                  <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-2`}>
                    Step progress:
                  </p>
                  <div className="w-full h-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FEC00F] rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <p className={`font-['Rajdhani'] text-[11px] font-semibold ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-1`}>
                    STEP 2 OF 4
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                LOADING DOTS
              </h3>
              
              <div className="flex items-center justify-center h-20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>

              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Generating strategy...
              </p>
            </div>

            <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
              <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'} mb-4`}>
                SKELETON LOADER
              </h3>
              
              <div className="space-y-3">
                <div className="h-4 bg-[#EEEEEE] rounded-md animate-pulse"></div>
                <div className="h-4 bg-[#EEEEEE] rounded-md animate-pulse w-4/5"></div>
                <div className="h-4 bg-[#EEEEEE] rounded-md animate-pulse w-3/5"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ICONS LIBRARY */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            ICON LIBRARY
          </h2>

          <div className={`rounded-xl p-8 ${darkMode ? 'bg-[#1E1E1E]' : 'bg-white border border-[#BDBDBD]'}`}>
            <p className={`font-['Quicksand'] text-[13px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mb-6`}>
              Using Lucide React icon library. All icons shown at 24x24px default size.
            </p>
            
            <div className="grid grid-cols-6 md:grid-cols-12 gap-6">
              {[
                { Icon: Sparkles, name: 'Sparkles' },
                { Icon: TrendingUp, name: 'Trending' },
                { Icon: Database, name: 'Database' },
                { Icon: Calculator, name: 'Calculator' },
                { Icon: Target, name: 'Target' },
                { Icon: BarChart3, name: 'Chart' },
                { Icon: Lightbulb, name: 'Ideas' },
                { Icon: Book, name: 'Book' },
                { Icon: Settings, name: 'Settings' },
                { Icon: Search, name: 'Search' },
                { Icon: Bell, name: 'Bell' },
                { Icon: User, name: 'User' },
                { Icon: Upload, name: 'Upload' },
                { Icon: Download, name: 'Download' },
                { Icon: Copy, name: 'Copy' },
                { Icon: Trash2, name: 'Trash' },
                { Icon: Eye, name: 'Eye' },
                { Icon: X, name: 'Close' },
                { Icon: Check, name: 'Check' },
                { Icon: AlertCircle, name: 'Alert' },
                { Icon: Info, name: 'Info' },
                { Icon: Folder, name: 'Folder' },
                { Icon: Paperclip, name: 'Attach' },
                { Icon: MessageSquare, name: 'Message' }
              ].map(({ Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-[#EEEEEE] flex items-center justify-center hover:bg-[#FEC00F]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#757575]" />
                  </div>
                  <span className={`font-['Quicksand'] text-[10px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THEME TOGGLE */}
        <section className="mb-20">
          <h2 className={`font-['Rajdhani'] text-[28px] font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-[#212121]'} mb-8`}>
            THEME SELECTION
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <button className={`rounded-xl p-6 transition-all ${!darkMode ? 'border-2 border-[#FEC00F] shadow-lg' : 'border-2 border-[#BDBDBD]'}`}
              onClick={() => setDarkMode(false)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  LIGHT MODE
                </h3>
                <div className={`w-5 h-5 rounded-full border-2 ${!darkMode ? 'border-[#FEC00F] bg-[#FEC00F]' : 'border-[#BDBDBD]'} flex items-center justify-center`}>
                  {!darkMode && <Check className="w-3 h-3 text-[#212121]" />}
                </div>
              </div>
              <Sun className="w-8 h-8 text-[#FEC00F] mx-auto mb-3" />
              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Clean, bright interface
              </p>
            </button>

            <button className={`rounded-xl p-6 transition-all ${darkMode ? 'border-2 border-[#FFD740] shadow-lg' : 'border-2 border-[#BDBDBD]'}`}
              onClick={() => setDarkMode(true)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-['Rajdhani'] text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-[#212121]'}`}>
                  DARK MODE
                </h3>
                <div className={`w-5 h-5 rounded-full border-2 ${darkMode ? 'border-[#FFD740] bg-[#FFD740]' : 'border-[#BDBDBD]'} flex items-center justify-center`}>
                  {darkMode && <Check className="w-3 h-3 text-[#212121]" />}
                </div>
              </div>
              <Moon className="w-8 h-8 text-[#FFD740] mx-auto mb-3" />
              <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} text-center`}>
                Easy on the eyes at night
              </p>
            </button>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-12">
          <div className={`inline-block px-8 py-4 rounded-xl ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#EEEEEE]'}`}>
            <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'}`}>
              © 2025 POTOMAC FUND MANAGEMENT
            </p>
            <p className={`font-['Quicksand'] text-[11px] ${darkMode ? 'text-[#9E9E9E]' : 'text-[#757575]'} mt-1`}>
              DEVELOPED BY SOHAIB ALI
            </p>
          </div>
        </section>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes loadProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Logo Outline Tracing Animation - Continuous */
        @keyframes rainbowOutline {
          0% {
            filter: 
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 0 0px transparent)
              drop-shadow(3px 0 6px rgba(191, 255, 0, 1))
              drop-shadow(3px 0 12px rgba(191, 255, 0, 0.8))
              hue-rotate(0deg);
          }
          25% {
            filter: 
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 3px 6px rgba(255, 107, 157, 1))
              drop-shadow(0 3px 12px rgba(255, 107, 157, 0.8))
              hue-rotate(90deg);
          }
          50% {
            filter: 
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 0 0px transparent)
              drop-shadow(-3px 0 6px rgba(199, 36, 177, 1))
              drop-shadow(-3px 0 12px rgba(199, 36, 177, 0.8))
              hue-rotate(180deg);
          }
          75% {
            filter: 
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 -3px 6px rgba(0, 245, 255, 1))
              drop-shadow(0 -3px 12px rgba(0, 245, 255, 0.8))
              hue-rotate(270deg);
          }
          100% {
            filter: 
              drop-shadow(0 0 0px transparent)
              drop-shadow(0 0 0px transparent)
              drop-shadow(3px 0 6px rgba(191, 255, 0, 1))
              drop-shadow(3px 0 12px rgba(191, 255, 0, 0.8))
              hue-rotate(360deg);
          }
        }

        @keyframes logoGlowBg {
          0%, 100% {
            background: radial-gradient(circle, rgba(254, 192, 15, 0.3) 0%, transparent 70%);
            transform: scale(1);
          }
          50% {
            background: radial-gradient(circle, rgba(191, 255, 0, 0.5) 0%, transparent 70%);
            transform: scale(1.2);
          }
        }

        /* Logo glow background */
        .logo-glow-bg {
          animation: logoGlowBg 2s ease-in-out infinite;
          border-radius: 50%;
        }

        /* Outline container with edge detection */
        .logo-outline-container {
          pointer-events: none;
        }

        /* Continuous outline tracing effect */
        .logo-outline-trace {
          animation: rainbowOutline 3s linear infinite;
          mix-blend-mode: screen;
          /* Create outline by using morphology-like effect with filters */
          filter: 
            drop-shadow(0 0 0px transparent)
            drop-shadow(0 0 0px transparent)
            drop-shadow(2px 0 4px rgba(191, 255, 0, 1))
            drop-shadow(2px 0 8px rgba(191, 255, 0, 0.8));
        }

        @keyframes neonProgress {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes electricSpark {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(360deg);
            opacity: 0.8;
          }
          90% {
            opacity: 0;
          }
        }

        @keyframes neonTextPulse {
          0%, 100% {
            text-shadow: 0 0 5px rgba(191, 255, 0, 0.8),
                         0 0 10px rgba(254, 192, 15, 0.6),
                         0 0 15px rgba(255, 107, 157, 0.4);
            opacity: 0.9;
          }
          50% {
            text-shadow: 0 0 10px rgba(191, 255, 0, 1),
                         0 0 20px rgba(254, 192, 15, 0.8),
                         0 0 30px rgba(255, 107, 157, 0.6),
                         0 0 40px rgba(199, 36, 177, 0.4);
            opacity: 1;
          }
        }



        /* Neon Progress Bar */
        .neon-progress {
          background: linear-gradient(90deg, 
            #BFFF00 0%, 
            #FEC00F 20%, 
            #FF6B9D 40%, 
            #C724B1 60%, 
            #7B2CBF 80%,
            #00F5FF 100%
          );
          background-size: 200% 100%;
          animation: neonProgress 2s linear infinite;
          box-shadow: 0 0 15px rgba(191, 255, 0, 0.6),
                      0 0 25px rgba(254, 192, 15, 0.5),
                      0 0 35px rgba(255, 107, 157, 0.4),
                      inset 0 0 10px rgba(255, 255, 255, 0.3);
        }

        /* Electric Spark at Progress Bar Edge */
        .electric-spark {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, 
            rgba(191, 255, 0, 0.9) 0%, 
            rgba(254, 192, 15, 0.6) 40%,
            transparent 70%
          );
          border-radius: 50%;
          animation: electricSpark 0.8s ease-in-out infinite;
        }

        /* Neon Text */
        .neon-text {
          color: #FEC00F;
          animation: neonTextPulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
