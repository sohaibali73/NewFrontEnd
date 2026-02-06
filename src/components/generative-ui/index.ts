/**
 * Generative UI Components
 * 
 * Rich React components that render tool call results as interactive UI
 * instead of plain text. Maps to backend tools in core/tools.py.
 * 
 * Usage in ChatPage: When AI SDK v5 returns a tool part with
 * type `tool-${toolName}`, render the corresponding component.
 */

// Stock data display (get_stock_data tool)
export { StockCard } from './StockCard';

// Live stock chart with candlestick/line/area (get_stock_chart tool)
export { LiveStockChart } from './LiveStockChart';

// Technical analysis indicators & signals (technical_analysis tool)
export { TechnicalAnalysis } from './TechnicalAnalysis';

// Weather display with forecast (get_weather tool)
export { WeatherCard } from './WeatherCard';

// News headlines with sentiment (get_news tool)
export { NewsHeadlines } from './NewsHeadlines';

// Interactive code sandbox (code_sandbox tool)
export { CodeSandbox } from './CodeSandbox';

// Data visualization charts - bar, line, pie, donut, scatter, area (create_chart tool)
export { DataChart } from './DataChart';

// Python code execution result (execute_python tool)
export { CodeExecution } from './CodeExecution';

// Knowledge base search results (search_knowledge_base tool)
export { KnowledgeBaseResults } from './KnowledgeBaseResults';

// AFL code tools (generate, validate, debug, explain, sanity_check)
export {
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
} from './AFLCodeCard';

// Web search results (web_search tool)
export { WebSearchResults } from './WebSearchResults';

// Loading state for any tool
export { ToolLoading } from './ToolLoading';

// Legacy React component wrapper
export { default as ReactComponent } from './ReactComponent';
