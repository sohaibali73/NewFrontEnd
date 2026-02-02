import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Search,
  GitBranch,
  Code,
  Check,
  Send,
  Loader2,
  ArrowRight,
  Clock,
  RefreshCw,
  Copy,
  Zap,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  Paperclip,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import logo from '@/assets/yellowlogo.png';
import Editor from '@monaco-editor/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
  schematic?: string;
  code?: string;
}

export function ReverseEngineerPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [description, setDescription] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [copiedSchematic, setCopiedSchematic] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [schematicCollapsed, setSchematicCollapsed] = useState(false);
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Theme-aware colors
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    sidebar: isDark ? '#1E1E1E' : '#f8f9fa',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    inputBg: isDark ? '#2A2A2A' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    codeBg: isDark ? '#0D1117' : '#f5f5f5',
  };

  const steps = [
    { icon: FileText, label: 'DESCRIBE', desc: 'Describe the strategy' },
    { icon: Search, label: 'RESEARCH', desc: 'AI researches components' },
    { icon: GitBranch, label: 'SCHEMATIC', desc: 'Generate architecture' },
    { icon: Code, label: 'CODE', desc: 'Generate AFL code' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [description]);

  const cleanText = (text: unknown): string => {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/#{1,6}\s*/g, '');
    cleaned = cleaned.replace(/`/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: 'New Strategy Session',
      created_at: new Date().toISOString(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setDescription('');
    setActiveStep(0);
    setError('');
    setAttachedFile(null);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
      setDescription('');
      setActiveStep(0);
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStart = async () => {
    if (!description.trim()) {
      setError('Please describe your strategy');
      return;
    }
    
    setLoading(true);
    setError('');
    setActiveStep(1);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: description,
      timestamp: new Date(),
    };

    const updatedMessages = [...(selectedSession?.messages || []), userMsg];

    try {
      const data = await apiClient.startReverseEngineering(description);
      const researchText = cleanText(data.response || 'Strategy analysis completed.');
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: researchText,
        timestamp: new Date(),
      };

      const newMessages = [...updatedMessages, assistantMsg];
      
      if (selectedSession) {
        const updatedSession = {
          ...selectedSession,
          title: description.slice(0, 50),
          messages: newMessages,
        };
        setSelectedSession(updatedSession);
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
      } else {
        const newSession: Session = {
          id: `session-${Date.now()}`,
          title: description.slice(0, 50),
          created_at: new Date().toISOString(),
          messages: newMessages,
        };
        setSessions(prev => [newSession, ...prev]);
        setSelectedSession(newSession);
      }
      
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setActiveStep(0);
    } finally {
      setLoading(false);
      setDescription('');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || loading || !selectedSession) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...selectedSession.messages, userMsg];
    const updatedSession = { ...selectedSession, messages: updatedMessages };
    setSelectedSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));

    try {
      const data = await apiClient.continueReverseEngineering(selectedSession.id, userMessage);
      const responseText = cleanText(data.response || 'I understand. Let me continue analyzing your strategy.');
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      const finalSession = { ...selectedSession, messages: finalMessages };
      setSelectedSession(finalSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? finalSession : s));
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      const finalSession = { ...selectedSession, messages: finalMessages };
      setSelectedSession(finalSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? finalSession : s));
    } finally {
      setLoading(false);
    }
  };

  const handleSchematic = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.generateStrategySchematic(selectedSession.id);
      const schematicText = cleanText(data.response) || `STRATEGY ARCHITECTURE

PRICE DATA INPUT
  OHLCV Data Stream

INDICATOR CALCULATIONS
  Moving Averages
  RSI / MACD
  Volume Analysis

SIGNAL LOGIC
  Entry Rules
  Exit Rules
  Confirmation Filters

RISK MANAGEMENT
  Stop Loss Levels
  Position Sizing
  Maximum Drawdown`;

      const updatedSession = { ...selectedSession, schematic: schematicText };
      setSelectedSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schematic');
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.generateStrategyCode(selectedSession.id);
      const codeText = data.afl_code || `// AFL Strategy Code
// Generated by Analyst by Potomac

// Strategy Parameters
Period = Param("Period", 20, 5, 100, 1);
StopLoss = Param("Stop Loss %", 2, 0.5, 10, 0.5);

// Calculate Indicators
FastMA = MA(Close, Period);
SlowMA = MA(Close, Period * 2);
RSI_Val = RSI(14);

// Entry Conditions
BuySignal = Cross(FastMA, SlowMA) AND RSI_Val < 70;
SellSignal = Cross(SlowMA, FastMA) OR RSI_Val > 80;

// Execute Trades
Buy = BuySignal;
Sell = SellSignal;

// Risk Management
ApplyStop(stopTypeLoss, stopModePercent, StopLoss);

// Position Sizing
PositionSize = 100;`;

      const updatedSession = { ...selectedSession, code: codeText };
      setSelectedSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
      setActiveStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySchematic = () => {
    if (selectedSession?.schematic) {
      navigator.clipboard.writeText(selectedSession.schematic);
      setCopiedSchematic(true);
      setTimeout(() => setCopiedSchematic(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (selectedSession?.code) {
      navigator.clipboard.writeText(selectedSession.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (!selectedSession?.code) return;
    
    const blob = new Blob([selectedSession.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_${Date.now()}.afl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    
    monaco.languages.register({ id: 'afl' });
    
    monaco.languages.setMonarchTokensProvider('afl', {
      keywords: [
        'Buy', 'Sell', 'Short', 'Cover', 'Filter', 
        'if', 'else', 'for', 'while', 'function',
        'SetOption', 'SetTradeDelays', 'SetPositionSize',
        'Param', 'Optimize', 'Plot', 'PlotShapes',
        'ExRem', 'Flip', 'Cross', 'TimeFrameSet', 'TimeFrameRestore',
      ],
      
      builtinFunctions: [
        'MA', 'EMA', 'SMA', 'WMA', 'DEMA', 'TEMA',
        'RSI', 'MACD', 'ATR', 'ADX', 'CCI', 'MFI',
        'BBandTop', 'BBandBot', 'SAR', 'ROC',
        'HHV', 'LLV', 'Ref', 'Sum', 'Cum',
      ],
      
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@builtinFunctions': 'type.identifier',
              '@default': 'identifier'
            }
          }],
          [/".*?"/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/\d+/, 'number'],
        ],
        comment: [
          [/\*\//, 'comment', '@pop'],
          [/./, 'comment']
        ],
      },
    });
  }

  return (
    <div style={{
      height: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
      position: 'relative',
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx,.csv"
      />

      {/* Re-open button when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: 'rgba(254, 192, 15, 0.3)',
            border: '1px solid rgba(254, 192, 15, 0.5)',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(254, 192, 15, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(254, 192, 15, 0.3)';
          }}
        >
          <ChevronRight size={20} color="#FEC00F" />
        </button>
      )}

      {/* Sessions Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '320px',
        backgroundColor: colors.sidebar,
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, border 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={24} color="#FEC00F" />
            <div>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
                textTransform: 'uppercase',
              }}>
                SESSIONS
              </h2>
              <p style={{
                fontSize: '11px',
                color: colors.textMuted,
                margin: 0,
              }}>
                Reverse Engineer
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(true)}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.inputBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Session Button */}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={handleNewSession}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#FEC00F',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#212121',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px rgba(254,192,15,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(254,192,15,0.3)';
            }}
          >
            <GitBranch size={18} />
            New Session
          </button>
        </div>

        {/* Sessions List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '0 12px 12px',
        }}>
          {sessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
            }}>
              <GitBranch size={40} color={colors.textMuted} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ 
                color: colors.textMuted, 
                fontSize: '13px', 
                margin: 0,
                lineHeight: 1.6,
              }}>
                No sessions yet.<br />Start a new one!
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                }}
              >
                <button
                  onClick={() => {
                    setSelectedSession(session);
                    setActiveStep(session.code ? 4 : session.schematic ? 3 : session.messages.length > 0 ? 2 : 0);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 14px',
                    backgroundColor: selectedSession?.id === session.id 
                      ? (isDark ? 'rgba(254,192,15,0.15)' : 'rgba(254,192,15,0.2)')
                      : 'transparent',
                    border: selectedSession?.id === session.id 
                      ? '1px solid rgba(254,192,15,0.4)' 
                      : '1px solid transparent',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSession?.id !== session.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitBranch size={14} color={selectedSession?.id === session.id ? '#FEC00F' : colors.textMuted} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: selectedSession?.id === session.id ? 600 : 400,
                      color: selectedSession?.id === session.id ? colors.text : colors.textMuted,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {session.title || 'New Strategy Session'}
                    </span>
                  </div>
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '26px',
                    height: '26px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '0.5';
                  }}
                >
                  <Trash2 size={13} color="#EF4444" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background,
        minWidth: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '2px',
            marginBottom: '8px',
            margin: 0,
          }}>
            REVERSE ENGINEER
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '15px', margin: 0 }}>
            Transform strategy descriptions into working AFL code
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '900px',
          }}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isComplete = index < activeStep;

              return (
                <React.Fragment key={step.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      backgroundColor: isComplete ? '#2D7F3E' : isActive ? '#FEC00F' : colors.inputBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      transition: 'all 0.3s',
                      border: `1px solid ${colors.border}`,
                    }}>
                      {isComplete ? (
                        <Check size={24} color="#FFFFFF" />
                      ) : (
                        <Icon size={24} color={isActive ? '#212121' : colors.textMuted} />
                      )}
                    </div>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isComplete || isActive ? colors.text : colors.textMuted,
                      letterSpacing: '0.5px',
                    }}>
                      {step.label}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: '11px', marginTop: '4px' }}>
                      {step.desc}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: index < activeStep ? '#2D7F3E' : colors.border,
                      margin: '0 16px',
                      marginBottom: '40px',
                      transition: 'background-color 0.3s',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            margin: '24px 32px 0',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid #DC2626',
            borderRadius: '8px',
            padding: '12px 16px',
          }}>
            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: schematicCollapsed && codeCollapsed 
            ? '1fr' 
            : schematicCollapsed 
            ? '400px 1fr' 
            : codeCollapsed 
            ? '400px 1fr' 
            : '400px 1fr 1fr',
          gap: '24px',
          padding: '24px 32px',
          overflow: 'hidden',
          minHeight: 0,
          transition: 'grid-template-columns 0.3s ease',
        }}>
          {/* Chat Panel */}
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {!selectedSession || activeStep === 0 ? (
              // Initial Description Input
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  letterSpacing: '1px',
                  marginBottom: '20px',
                  marginTop: 0,
                }}>
                  STRATEGY DESCRIPTION
                </h2>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the trading strategy you want to reverse engineer..."
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.text,
                    fontSize: '14px',
                    fontFamily: "'Quicksand', sans-serif",
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
                
                {/* Attached File Display */}
                {attachedFile && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <Paperclip size={14} color={colors.textMuted} />
                      <span style={{
                        fontSize: '13px',
                        color: colors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {attachedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={removeAttachment}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X size={14} color="#EF4444" />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={handleFileAttach}
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.inputBg;
                      e.currentTarget.style.borderColor = '#FEC00F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    onClick={handleStart}
                    disabled={!description.trim() || loading}
                    style={{
                      flex: 1,
                      height: '48px',
                      backgroundColor: !description.trim() || loading ? colors.border : '#FEC00F',
                      border: 'none',
                      borderRadius: '8px',
                      color: !description.trim() || loading ? colors.textMuted : '#212121',
                      fontSize: '14px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: !description.trim() || loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'START ANALYSIS'}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              // Chat Interface
              <>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      margin: 0,
                    }}>
                      RESEARCH CHAT
                    </h2>
                    <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>
                      Discuss your strategy with AI
                    </p>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  {selectedSession.messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '16px',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: msg.role === 'user' ? '#FEC00F' : colors.inputBg,
                          color: msg.role === 'user' ? '#212121' : colors.text,
                          fontSize: '13px',
                          lineHeight: 1.6,
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: colors.textMuted }}>
                          <Clock size={10} />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={logo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: colors.inputBg }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: '#FEC00F',
                              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      placeholder="Ask follow-up questions..."
                      style={{
                        flex: 1,
                        height: '40px',
                        padding: '0 12px',
                        backgroundColor: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || loading}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: chatInput.trim() && !loading ? '#FEC00F' : colors.border,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: chatInput.trim() && !loading ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={16} color={chatInput.trim() && !loading ? '#212121' : colors.textMuted} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {activeStep === 2 && (
                      <button
                        onClick={handleSchematic}
                        disabled={loading}
                        style={{
                          flex: 1,
                          height: '36px',
                          backgroundColor: loading ? colors.border : '#FEC00F',
                          border: 'none',
                          borderRadius: '8px',
                          color: loading ? colors.textMuted : '#212121',
                          fontSize: '12px',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        GENERATE SCHEMATIC
                      </button>
                    )}
                    {activeStep === 3 && (
                      <button
                        onClick={handleCode}
                        disabled={loading}
                        style={{
                          flex: 1,
                          height: '36px',
                          backgroundColor: loading ? colors.border : '#FEC00F',
                          border: 'none',
                          borderRadius: '8px',
                          color: loading ? colors.textMuted : '#212121',
                          fontSize: '12px',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        GENERATE CODE
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Schematic Panel */}
          {!schematicCollapsed && (
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <h2 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}>
                STRATEGY SCHEMATIC
              </h2>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {selectedSession?.schematic && (
                  <button
                    onClick={handleCopySchematic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: copiedSchematic ? '#2D7F3E' : 'transparent',
                      border: `1px solid ${copiedSchematic ? '#2D7F3E' : colors.border}`,
                      borderRadius: '6px',
                      color: copiedSchematic ? '#fff' : colors.text,
                      fontSize: '12px',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedSchematic ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSchematic ? 'COPIED!' : 'COPY'}
                  </button>
                )}
                <button
                  onClick={() => setSchematicCollapsed(true)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.inputBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronRight size={16} color={colors.textMuted} />
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              backgroundColor: colors.codeBg,
              overflow: 'auto',
              padding: '20px',
            }}>
              {selectedSession?.schematic ? (
                <pre style={{
                  margin: 0,
                  fontFamily: "'Fira Code', monospace",
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: colors.text,
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedSession.schematic}
                </pre>
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                }}>
                  <GitBranch size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', margin: 0, textAlign: 'center' }}>
                    {activeStep === 0 
                      ? 'Describe a strategy to begin' 
                      : activeStep < 3
                      ? 'Continue chatting, then generate schematic'
                      : 'Click "Generate Schematic"'}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Code Output Panel */}
          {!codeCollapsed && (
          <div style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: isDark ? '#252540' : '#e8e8e8',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
                  GENERATED CODE
                </span>
                {selectedSession?.code && (
                  <span style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    backgroundColor: colors.inputBg,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {selectedSession.code.split('\n').length} lines
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
              }}>
                <button
                  onClick={handleCopyCode}
                  disabled={!selectedSession?.code}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: copiedCode ? '#22C55E' : 'transparent',
                    border: `1px solid ${copiedCode ? '#22C55E' : colors.border}`,
                    borderRadius: '6px',
                    color: copiedCode ? '#fff' : colors.text,
                    fontSize: '12px',
                    cursor: selectedSession?.code ? 'pointer' : 'not-allowed',
                    opacity: selectedSession?.code ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCode}
                  disabled={!selectedSession?.code}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedSession?.code ? '#FEC00F' : colors.inputBg,
                    border: 'none',
                    borderRadius: '6px',
                    color: selectedSession?.code ? '#212121' : colors.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: selectedSession?.code ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.code) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(254,192,15,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'hidden',
            }}>
              {selectedSession?.code ? (
                <Editor
                  height="100%"
                  defaultLanguage="afl"
                  value={selectedSession.code}
                  onChange={(value) => {
                    if (selectedSession && value !== undefined) {
                      const updatedSession = { ...selectedSession, code: value };
                      setSelectedSession(updatedSession);
                      setSessions(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
                    }
                  }}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    fontFamily: "'Fira Code', 'Monaco', monospace",
                  }}
                  onMount={handleEditorDidMount}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                  padding: '20px',
                  backgroundColor: colors.codeBg,
                }}>
                  <Code size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', margin: 0, textAlign: 'center' }}>
                    {activeStep === 0 
                      ? 'Describe a strategy to begin' 
                      : activeStep < 4
                      ? 'Complete previous steps, then generate code'
                      : 'Click "Generate Code"'}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Collapsed Panel Expand Buttons */}
      {(schematicCollapsed || codeCollapsed) && (
        <div style={{
          position: 'fixed',
          right: '32px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 100,
        }}>
          {schematicCollapsed && (
            <button
              onClick={() => setSchematicCollapsed(false)}
              style={{
                width: '48px',
                height: '120px',
                background: 'rgba(254, 192, 15, 0.3)',
                border: '1px solid rgba(254, 192, 15, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(254, 192, 15, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(254, 192, 15, 0.3)';
              }}
            >
              <ChevronLeft size={20} color="#FEC00F" />
              <span style={{
                writingMode: 'vertical-rl',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                color: '#FEC00F',
                letterSpacing: '1px',
              }}>
                SCHEMATIC
              </span>
              <GitBranch size={16} color="#FEC00F" />
            </button>
          )}
          {codeCollapsed && (
            <button
              onClick={() => setCodeCollapsed(false)}
              style={{
                width: '48px',
                height: '120px',
                background: 'rgba(254, 192, 15, 0.3)',
                border: '1px solid rgba(254, 192, 15, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(254, 192, 15, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(254, 192, 15, 0.3)';
              }}
            >
              <ChevronLeft size={20} color="#FEC00F" />
              <span style={{
                writingMode: 'vertical-rl',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                color: '#FEC00F',
                letterSpacing: '1px',
              }}>
                CODE
              </span>
              <Code size={16} color="#FEC00F" />
            </button>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}