/**
 * ReactArtifact - Renders React/JSX components in a sandboxed iframe
 * FIXED: Babel syntax errors, component detection, and streaming support
 */

import React, { useEffect, useRef, useState } from 'react';

interface ReactArtifactProps {
  code: string;
  isDark: boolean;
  onError?: (error: string | null) => void;
}

export function ReactArtifact({ code, isDark, onError }: ReactArtifactProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!iframeRef.current) return;

    setLoading(true);
    onError?.(null);

    // Strip import/export statements since we're using UMD builds
    var cleanCode = code.trim();
    
    // Remove import statements (all variations)
    cleanCode = cleanCode.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    
    // Remove export statements but keep the content
    cleanCode = cleanCode.replace(/^export\s+default\s+/gm, '');
    cleanCode = cleanCode.replace(/^export\s+/gm, '');
    
    // Clean up any empty lines at the start
    cleanCode = cleanCode.replace(/^\s*\n/gm, '').trim();
    
    // Build the HTML content for the iframe with proper Babel configuration
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${isDark ? '#121212' : '#ffffff'};
            color: ${isDark ? '#ffffff' : '#212121'};
            padding: 16px;
            min-height: 100vh;
            overflow-x: hidden;
        }
        #root {
            width: 100%;
            min-height: calc(100vh - 32px);
        }
        .error-container {
            color: #DC2626;
            padding: 16px;
            border: 1px solid #DC2626;
            border-radius: 8px;
            background: rgba(220, 38, 38, 0.1);
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-break: break-word;
        }
    </style>
</head>
<body class="${isDark ? 'dark' : ''}">
    <div id="root"></div>
    
    <script type="text/babel" data-presets="react,env">
      (function() {
        try {
          ${cleanCode}

          var MainComponent = null;
          
          if (typeof App !== 'undefined') {
            MainComponent = App;
          } else if (typeof AssistantComponent !== 'undefined') {
            MainComponent = AssistantComponent;
          } else {
            var keys = Object.keys(window);
            for (var i = keys.length - 1; i >= 0; i--) {
              var k = keys[i];
              if (typeof window[k] === 'function' && /^[A-Z]/.test(k)) {
                MainComponent = window[k];
                break;
              }
            }
          }

          if (MainComponent) {
            var root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(MainComponent));
            window.parent.postMessage({ type: 'REACT_ARTIFACT_LOADED' }, '*');
          } else {
            var errorMsg = "No valid React component found. Ensure your component is named 'App' or starts with a Capital Letter.";
            console.error(errorMsg);
            document.getElementById('root').innerHTML = 
                '<div class="error-container"><strong>Component Not Found</strong><br /><br />' + 
                errorMsg + '</div>';
            window.parent.postMessage({ type: 'REACT_ARTIFACT_ERROR', error: errorMsg }, '*');
          }
        } catch (err) {
          console.error("Artifact Runtime Error:", err);
          document.getElementById('root').innerHTML = 
              '<div class="error-container"><strong>Execution Error:</strong><br /><br />' +
              (err.message || 'Unknown error') + '</div>';
          window.parent.postMessage({ type: 'REACT_ARTIFACT_ERROR', error: err.message }, '*');
        }
      })();
    </script>
</body>
</html>`;

    // Create blob URL for the iframe
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Set up message listener for load/error events
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REACT_ARTIFACT_LOADED') {
        setLoading(false);
      } else if (event.data?.type === 'REACT_ARTIFACT_ERROR') {
        setLoading(false);
        onError?.(event.data.error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Load the iframe
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
    
    // Fallback timeout in case message isn't received
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
      URL.revokeObjectURL(url);
      clearTimeout(timeout);
    };
  }, [code, isDark, onError]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: isDark ? '#121212' : '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#121212' : '#ffffff',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: isDark ? '#9E9E9E' : '#757575',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: `3px solid ${isDark ? '#424242' : '#e0e0e0'}`,
              borderTopColor: '#FEC00F',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '13px', fontFamily: 'Quicksand, sans-serif' }}>
              Loading React component...
            </span>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="React Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          minHeight: '400px',
          display: 'block',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ReactArtifact;
