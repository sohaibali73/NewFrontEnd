'use client';

import React from 'react';
import {
  StockCard,
  LiveStockChart,
  TechnicalAnalysis,
  WeatherCard,
  NewsHeadlines,
  CodeSandbox,
  DataChart,
  CodeExecution,
  KnowledgeBaseResults,
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
  WebSearchResults,
  ToolLoading,
  StockScreener,
  StockComparison,
  SectorPerformance,
  PositionSizer,
  CorrelationMatrix,
  DividendCard,
  RiskMetrics,
  MarketOverview,
  BacktestResults,
  OptionsSnapshot,
  PresentationCard,
  LiveSportsScores,
  SearchTrends,
  LinkedInPost,
  WebsitePreview,
  FoodOrder,
  FlightTracker,
  FlightSearchCard,
} from '@/components/generative-ui';

/**
 * Tool registry: maps tool names to their output components.
 * Eliminates the ~600-line switch statement in ChatPage and enables
 * easy addition of new tools without touching rendering logic.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolComponent = React.ComponentType<any>;

interface ToolEntry {
  component: ToolComponent;
  /** Override how props are derived from part.output (default: spread output) */
  mapProps?: (output: unknown) => Record<string, unknown>;
}

const TOOL_REGISTRY: Record<string, ToolEntry> = {
  // Stock / Finance
  get_stock_data: { component: StockCard },
  get_stock_chart: { component: LiveStockChart },
  technical_analysis: { component: TechnicalAnalysis },
  screen_stocks: { component: StockScreener },
  compare_stocks: { component: StockComparison },
  get_sector_performance: { component: SectorPerformance },
  calculate_position_size: { component: PositionSizer },
  get_correlation_matrix: { component: CorrelationMatrix },
  get_dividend_info: { component: DividendCard },
  calculate_risk_metrics: { component: RiskMetrics },
  get_market_overview: { component: MarketOverview },
  backtest_quick: { component: BacktestResults },
  get_options_snapshot: { component: OptionsSnapshot },

  // AFL
  generate_afl_code: { component: AFLGenerateCard },
  validate_afl: { component: AFLValidateCard },
  debug_afl_code: { component: AFLDebugCard },
  explain_afl_code: { component: AFLExplainCard },
  sanity_check_afl: { component: AFLSanityCheckCard },

  // Code / Data
  execute_python: { component: CodeExecution },
  code_sandbox: { component: CodeSandbox },
  create_chart: { component: DataChart },
  search_knowledge_base: { component: KnowledgeBaseResults },
  web_search: { component: WebSearchResults },

  // Lifestyle / Utility
  get_weather: { component: WeatherCard },
  get_news: { component: NewsHeadlines },
  create_presentation: { component: PresentationCard },
  get_live_scores: { component: LiveSportsScores },
  get_search_trends: { component: SearchTrends },
  create_linkedin_post: { component: LinkedInPost },
  preview_website: { component: WebsitePreview },
  order_food: { component: FoodOrder },
  track_flight: { component: FlightTracker },

  // Flight search aliases
  search_flights: {
    component: FlightSearchCard,
    mapProps: (output) => ({ data: output }),
  },
  get_flights: {
    component: FlightSearchCard,
    mapProps: (output) => ({ data: output }),
  },
  find_flights: {
    component: FlightSearchCard,
    mapProps: (output) => ({ data: output }),
  },
};

export function getToolEntry(toolName: string): ToolEntry | undefined {
  return TOOL_REGISTRY[toolName];
}

/**
 * Renders a tool part by looking up the registry.
 * Returns null if the tool is not in the registry (caller should use fallback).
 */
export function renderRegisteredTool(
  toolName: string,
  part: { state: string; input?: unknown; output?: unknown; errorText?: string },
  key: React.Key,
): React.ReactNode | null {
  const entry = TOOL_REGISTRY[toolName];
  if (!entry) return null;

  switch (part.state) {
    case 'input-streaming':
    case 'input-available':
      return <ToolLoading key={key} toolName={toolName} input={part.input} />;

    case 'output-available': {
      const Component = entry.component;
      const rawOutput = typeof part.output === 'object' ? part.output : {};
      const props = entry.mapProps ? entry.mapProps(rawOutput) : rawOutput;
      return <Component key={key} {...props} />;
    }

    case 'output-error':
      return (
        <div
          key={key}
          className="p-3 rounded-xl mt-2 text-sm"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
        >
          {toolName.replace(/_/g, ' ')} error: {part.errorText}
        </div>
      );

    default:
      return null;
  }
}
