import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Play, Copy, Check, Code, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

interface ReactComponentProps {
  code: string;
  id: string;
}

/**
 * ReactComponent - Renders React/JSX code as an interactive component
 * This is a Generative UI component for the Vercel AI SDK tool parts
 * Supports rendering React components with Recharts for data visualization
 */
export const ReactComponent: React.FC<ReactComponentProps> = ({ code, id }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    cardBg: isDark ? '#1E1E1E' : '#ffffff',
    codeBg: isDark ? '#0D1117' : '#f5f5f5',
    border: isDark ? '#424242' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate HTML for iframe rendering
  const generateIframeContent = () => {
    // Extract imports and component code
    const hasRechartsImport = code.includes('recharts');
    const hasReactImport = code.includes("from 'react'");
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${hasRechartsImport ? '<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"></script>' : ''}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${isDark ? '#1a1a2e' : '#f8f9fa'};
      color: ${isDark ? '#e0e0e0' : '#333'};
      padding: 16px;
      min-height: 100vh;
    }
    #root { width: 100%; }
    .error { color: #ef4444; padding: 16px; background: rgba(239,68,68,0.1); border-radius: 8px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      // Make Recharts components available globally
      ${hasRechartsImport ? `
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, PieChart, Pie, Cell, Legend, ReferenceLine, Brush, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap, Sankey, FunnelChart, Funnel, LabelList } = Recharts;
      ` : ''}
      
      // Component code - remove imports and exports
      ${code
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+/g, '')
      }
      
      // Find and render the component
      const componentMatch = \`${code}\`.match(/(?:const|function)\\s+(\\w+)\\s*(?:=|\\()/);
      const ComponentName = componentMatch ? componentMatch[1] : null;
      
      if (ComponentName && typeof eval(ComponentName) === 'function') {
        const Component = eval(ComponentName);
        ReactDOM.createRoot(document.getElementById('root')).render(
          React.createElement(Component)
        );
      } else {
        document.getElementById('root').innerHTML = '<div class="error">Could not find component to render</div>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="error">Error: ' + err.message + '</div>';
      console.error(err);
    }
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (iframeRef.current && !showCode) {
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(generateIframeContent());
          doc.close();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render component');
      }
    }
  }, [code, isDark, showCode]);

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: '12px',
        margin: '16px 0',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: isDark ? '#161B22' : '#e8e8e8',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#60A5FA',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Rajdhani', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Play size={14} /> REACT COMPONENT
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowCode(!showCode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: showCode ? '#60A5FA' : 'transparent',
              border: `1px solid ${showCode ? '#60A5FA' : colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: showCode ? '#fff' : colors.textMuted,
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <Code size={14} />
            {showCode ? 'Preview' : 'Code'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.textMuted,
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: copied ? '#22C55E' : 'transparent',
              border: `1px solid ${copied ? '#22C55E' : colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: copied ? '#fff' : colors.textMuted,
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#EF4444',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : showCode ? (
        <pre
          style={{
            margin: 0,
            padding: '16px',
            fontFamily: "'Fira Code', 'Monaco', monospace",
            fontSize: '13px',
            color: isDark ? '#e0e0e0' : '#333',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            overflowX: 'auto',
            maxHeight: expanded ? 'none' : '400px',
            backgroundColor: colors.codeBg,
          }}
        >
          {code}
        </pre>
      ) : (
        <div
          style={{
            minHeight: expanded ? '500px' : '300px',
            maxHeight: expanded ? 'none' : '400px',
            overflow: 'auto',
            backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa',
          }}
        >
          <iframe
            ref={iframeRef}
            title={`react-component-${id}`}
            style={{
              width: '100%',
              height: expanded ? '500px' : '300px',
              border: 'none',
              backgroundColor: 'transparent',
            }}
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
};

export default ReactComponent;
