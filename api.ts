// API Client for communicating with the backend

import {
  User,
  AuthResponse,
  Message,
  Conversation,
  AFLGenerateRequest,
  AFLCode,
  Document,
  SearchResult,
  BacktestResult,
  Strategy,
  BrainStats,
  // Training types
  TrainingData,
  TrainingCreateRequest,
  QuickTrainRequest,
  CorrectionRequest,
  TrainingStats,
  TrainingCategory,
  TrainingType,
  // Feedback types
  UserFeedback,
  FeedbackCreateRequest,
  FeedbackReviewRequest,
  FeedbackStatus,
  // Suggestion types
  TrainingSuggestion,
  SuggestionCreateRequest,
  SuggestionReviewRequest,
  SuggestionStatus,
  // Analytics types
  AnalyticsOverview,
  AnalyticsTrends,
  LearningCurve,
  PopularPattern,
  TrainingEffectiveness,
  // Admin types
  AdminStatus,
  AdminUser,
  AdminConfig,
  // Training test types
  TrainingTestRequest,
  TrainingTestResult,
  // Knowledge types
  KnowledgeSearchResult,
  KnowledgeCategory,
  TrainingTypeInfo,
} from '@/types/api';
//import { MacroContext, SECFiling, ResearchSearchResult, ReportExport, ResearcherHealth } from '@/types/researcher';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://potomac-analyst-workbench-production.up.railway.app';



class APIClient {
  constructor() {
    // Token is managed through localStorage directly
  }

  async uploadFile(conversationId: string, formData: FormData) {
    // File upload needs longer timeout for large files
    return this.request(`/chat/conversations/${conversationId}/upload`, 'POST', formData, true, 60000);
  }

  private setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  private getToken() {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isFormData: boolean = false,
    timeoutMs: number = 30000
  ): Promise<T> {
    const headers: HeadersInit = {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body) {
      if (isFormData) {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async register(email: string, password: string, name: string, claudeApiKey: string, tavilyApiKey?: string) {
    const response = await this.request<AuthResponse>('/auth/register', 'POST', {
      email,
      password,
      name,
      claude_api_key: claudeApiKey,
      tavily_api_key: tavilyApiKey,
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<AuthResponse>('/auth/login', 'POST', {
      email,
      password,
    });
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  // ==================== AFL ENDPOINTS ====================

  async generateAFL(request: AFLGenerateRequest) {
    // AFL generation needs longer timeout for AI response
    return this.request<AFLCode>('/afl/generate', 'POST', request, false, 120000);
  }

  async optimizeAFL(code: string) {
    // Optimization needs longer timeout
    return this.request<AFLCode>('/afl/optimize', 'POST', { code }, false, 90000);
  }

  async debugAFL(code: string, errorMessage?: string) {
    // Debugging needs longer timeout
    return this.request<AFLCode>('/afl/debug', 'POST', {
      code,
      error_message: errorMessage,
    }, false, 90000);
  }

  async explainAFL(code: string) {
    // Explanation needs longer timeout
    return this.request<{ explanation: string }>('/afl/explain', 'POST', { code }, false, 60000);
  }

  async validateAFL(code: string) {
    return this.request<{ valid: boolean; errors?: string[] }>('/afl/validate', 'POST', { code });
  }

  async getAFLCodes() {
    return this.request<AFLCode[]>('/afl/codes');
  }

  async getAFLCode(codeId: string) {
    return this.request<AFLCode>(`/afl/codes/${codeId}`);
  }

  async deleteAFLCode(codeId: string) {
    return this.request<{ success: boolean }>(`/afl/codes/${codeId}`, 'DELETE');
  }

  // ==================== CHAT ENDPOINTS ====================

  async getConversations() {
    return this.request<Conversation[]>('/chat/conversations');
  }

  async createConversation(title: string = "New Conversation") {
    return this.request<Conversation>('/chat/conversations', 'POST', {
      title,
      conversation_type: "agent"
    });
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async deleteConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/chat/conversations/${conversationId}`, 'DELETE');
  }

  async sendMessage(content: string, conversationId?: string): Promise<{
    conversation_id: string;
    response: string;
    tools_used?: { tool: string; input: any }[];
  }> {
    return this.request<{
      conversation_id: string;
      response: string;
      tools_used?: { tool: string; input: any }[];
    }>('/chat/message', 'POST', {
      content,
      conversation_id: conversationId,
    }, false, 120000); // 2 minute timeout for AI responses
  }

  async getChatTools() {
    const response = await this.request<{ 
      tools: { name: string; description: string; type: string; parameters?: string[] }[]; 
      count: number 
    }>('/chat/tools');
    return response.tools;
  }

  // ==================== BRAIN/KNOWLEDGE BASE ENDPOINTS ====================

  async uploadDocument(file: File, title?: string, category: string = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('category', category);

    return this.request<Document>('/brain/upload', 'POST', formData, true);
  }

  async uploadDocumentsBatch(files: File[], category: string = 'general') {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);

    return this.request<Document[]>('/brain/upload-batch', 'POST', formData, true);
  }

  async uploadText(text: string, title?: string, category: string = 'general') {
    return this.request<Document>('/brain/upload-text', 'POST', {
      text,
      title,
      category,
    });
  }

  async searchKnowledge(query: string, category?: string, limit: number = 10) {
    return this.request<SearchResult[]>('/brain/search', 'POST', {
      query,
      category,
      limit,
    });
  }

  async getDocuments() {
    return this.request<Document[]>('/brain/documents');
  }

  async getBrainStats() {
    return this.request<BrainStats>('/brain/stats');
  }

  async deleteDocument(documentId: string) {
    return this.request<{ success: boolean }>(`/brain/documents/${documentId}`, 'DELETE');
  }

  // ==================== BACKTEST ENDPOINTS ====================

  async uploadBacktest(file: File, strategyId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (strategyId) formData.append('strategy_id', strategyId);

    return this.request<BacktestResult>('/backtest/upload', 'POST', formData, true);
  }

  async getBacktest(backtestId: string) {
    return this.request<BacktestResult>(`/backtest/${backtestId}`);
  }

  async getStrategyBacktests(strategyId: string) {
    return this.request<BacktestResult[]>(`/backtest/strategy/${strategyId}`);
  }

  // ==================== REVERSE ENGINEER ENDPOINTS ====================

  async startReverseEngineering(description: string) {
    // Use 'query' field name which backend expects
    return this.request<Strategy>('/reverse-engineer/start', 'POST', { query: description }, false, 90000);
  }

  async continueReverseEngineering(strategyId: string, content: string) {
    // Use 'message' field name and longer timeout for AI response
    return this.request<Strategy>('/reverse-engineer/continue', 'POST', {
      strategy_id: strategyId,
      message: content,
    }, false, 120000);
  }

  async researchStrategy(strategyId: string) {
    // Research can take time - 2 minute timeout
    return this.request<Strategy>(`/reverse-engineer/research/${strategyId}`, 'POST', {}, false, 120000);
  }

  async generateStrategySchematic(strategyId: string) {
    // Schematic generation - 90 second timeout
    return this.request<Strategy>(`/reverse-engineer/schematic/${strategyId}`, 'POST', {}, false, 90000);
  }

  async generateStrategyCode(strategyId: string) {
    // Code generation - 2 minute timeout
    return this.request<Strategy>(`/reverse-engineer/generate-code/${strategyId}`, 'POST', {}, false, 120000);
  }

  async getStrategy(strategyId: string) {
    return this.request<Strategy>(`/reverse-engineer/strategy/${strategyId}`);
  }

  // ==================== TRAIN ENDPOINTS ====================

  // Feedback
  async submitFeedback(feedback: FeedbackCreateRequest) {
    return this.request<UserFeedback>('/train/feedback', 'POST', feedback);
  }

  async getMyFeedback() {
    return this.request<UserFeedback[]>('/train/feedback/my');
  }

  async getFeedback(feedbackId: string) {
    return this.request<UserFeedback>(`/train/feedback/${feedbackId}`);
  }

  // Training Testing
  async testTraining(request: TrainingTestRequest) {
    return this.request<TrainingTestResult>('/train/test', 'POST', request);
  }

  async getTrainingEffectiveness() {
    return this.request<TrainingEffectiveness>('/train/effectiveness');
  }

  // Training Suggestions
  async suggestTraining(suggestion: SuggestionCreateRequest) {
    return this.request<TrainingSuggestion>('/train/suggest', 'POST', suggestion);
  }

  async getMySuggestions() {
    return this.request<TrainingSuggestion[]>('/train/suggestions/my');
  }

  // Learning Analytics
  async getLearningCurve() {
    return this.request<LearningCurve>('/train/analytics/learning-curve');
  }

  async getPopularPatterns() {
    return this.request<PopularPattern[]>('/train/analytics/popular-patterns');
  }

  // Knowledge Base
  async searchTrainingKnowledge(query: string, category?: TrainingCategory, limit: number = 10) {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    if (category) params.append('category', category);
    return this.request<KnowledgeSearchResult[]>(`/train/knowledge/search?${params}`);
  }

  async getKnowledgeCategories() {
    return this.request<KnowledgeCategory[]>('/train/knowledge/categories');
  }

  async getTrainingTypes() {
    return this.request<TrainingTypeInfo[]>('/train/knowledge/types');
  }

  // Quick Learning
  async quickLearn(code: string, explanation: string) {
    return this.request<{ success: boolean; message: string }>('/train/quick-learn', 'POST', {
      code,
      explanation,
    });
  }

  async getTrainStats() {
    return this.request<TrainingStats>('/train/stats');
  }

  // ==================== ADMIN ENDPOINTS ====================

  // Status & Overview
  async getAdminStatus() {
    return this.request<AdminStatus>('/admin/status');
  }

  // Admin Management
  async makeAdmin(userId: string) {
    return this.request<{ success: boolean }>(`/admin/make-admin/${userId}`, 'POST');
  }

  async revokeAdmin(userId: string) {
    return this.request<{ success: boolean }>(`/admin/revoke-admin/${userId}`, 'POST');
  }

  // Training Management
  async addTraining(training: TrainingCreateRequest) {
    return this.request<TrainingData>('/admin/train', 'POST', training);
  }

  async quickTrain(request: QuickTrainRequest) {
    return this.request<TrainingData>('/admin/train/quick', 'POST', request);
  }

  async addCorrection(correction: CorrectionRequest) {
    return this.request<TrainingData>('/admin/train/correction', 'POST', correction);
  }

  async batchImportTraining(items: TrainingCreateRequest[]) {
    return this.request<{ imported: number; failed: number }>('/admin/train/batch', 'POST', { items });
  }

  async getTrainingList(params?: {
    training_type?: TrainingType;
    category?: TrainingCategory;
    is_active?: boolean;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.training_type) searchParams.append('training_type', params.training_type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return this.request<TrainingData[]>(`/admin/training${query ? `?${query}` : ''}`);
  }

  async getTraining(trainingId: string) {
    return this.request<TrainingData>(`/admin/training/${trainingId}`);
  }

  async updateTraining(trainingId: string, updates: Partial<TrainingCreateRequest & { is_active: boolean }>) {
    return this.request<TrainingData>(`/admin/training/${trainingId}`, 'PUT', updates);
  }

  async deleteTraining(trainingId: string) {
    return this.request<{ success: boolean }>(`/admin/training/${trainingId}`, 'DELETE');
  }

  async toggleTraining(trainingId: string) {
    return this.request<TrainingData>(`/admin/training/${trainingId}/toggle`, 'POST');
  }

  async getTrainingStatsOverview() {
    return this.request<TrainingStats>('/admin/training/stats/overview');
  }

  async exportTraining(params?: { training_type?: TrainingType; category?: TrainingCategory }) {
    const searchParams = new URLSearchParams();
    if (params?.training_type) searchParams.append('training_type', params.training_type);
    if (params?.category) searchParams.append('category', params.category);
    
    const query = searchParams.toString();
    return this.request<TrainingData[]>(`/admin/training/export/all${query ? `?${query}` : ''}`);
  }

  async previewTrainingContext(category?: TrainingCategory) {
    const params = category ? `?category=${category}` : '';
    return this.request<{ context: string }>(`/admin/training/context/preview${params}`);
  }

  // User Management
  async getUsers() {
    return this.request<AdminUser[]>('/admin/users');
  }

  async getUser(userId: string) {
    return this.request<AdminUser>(`/admin/users/${userId}`);
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean }>(`/admin/users/${userId}`, 'DELETE');
  }

  // Feedback Review
  async getAllFeedback(params?: { status?: FeedbackStatus; feedback_type?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.feedback_type) searchParams.append('feedback_type', params.feedback_type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return this.request<UserFeedback[]>(`/admin/feedback${query ? `?${query}` : ''}`);
  }

  async getAdminFeedback(feedbackId: string) {
    return this.request<UserFeedback>(`/admin/feedback/${feedbackId}`);
  }

  async reviewFeedback(feedbackId: string, review: FeedbackReviewRequest) {
    return this.request<UserFeedback>(`/admin/feedback/${feedbackId}/review`, 'POST', review);
  }

  // Training Suggestions Review
  async getAllSuggestions(status?: SuggestionStatus) {
    const params = status ? `?status=${status}` : '';
    return this.request<TrainingSuggestion[]>(`/admin/suggestions${params}`);
  }

  async getSuggestion(suggestionId: string) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}`);
  }

  async reviewSuggestion(suggestionId: string, review: SuggestionReviewRequest) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/review`, 'POST', review);
  }

  async approveSuggestion(suggestionId: string, priority?: number) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/approve`, 'POST', { priority });
  }

  async rejectSuggestion(suggestionId: string, reason?: string) {
    return this.request<TrainingSuggestion>(`/admin/suggestions/${suggestionId}/reject`, 'POST', { reason });
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request<AnalyticsOverview>('/admin/analytics/overview');
  }

  async getAnalyticsTrends() {
    return this.request<AnalyticsTrends>('/admin/analytics/trends');
  }

  // Configuration
  async getAdminConfig() {
    return this.request<AdminConfig>('/admin/config');
  }

  async addAdminEmail(email: string) {
    return this.request<{ success: boolean }>(`/admin/config/add-admin-email?email=${encodeURIComponent(email)}`, 'POST');
  }

  // ==================== RESEARCHER ENDPOINTS ====================
  /*
  async getCompanyResearch(symbol: string) {
    return this.request<CompanyResearch>(`/api/researcher/company/${symbol}`, 'GET');
  }

  async getCompanyNews(symbol: string, limit: number = 20) {
    return this.request<{ news: NewsItem[] }>(`/api/researcher/news/${symbol}?limit=${limit}`, 'GET');
  }

  async analyzeStrategyFit(symbol: string, strategyType: string, timeframe: string) {
    return this.request<StrategyAnalysis>('/api/researcher/strategy-analysis', 'POST', {
      symbol,
      strategy_type: strategyType,
      timeframe
    });
  }

  async getPeerComparison(symbol: string, peers: string[]) {
    return this.request<PeerComparison>('/api/researcher/comparison', 'POST', {
      symbol,
      peers
    });
  }

  async getSECFilings(symbol: string) {
    return this.request<SECFiling[]>(`/api/researcher/sec-filings/${symbol}`, 'GET');
  }

  async getMacroContext() {
    return this.request<MacroContext>('/api/researcher/macro-context', 'GET');
  }

  async generateReport(symbol: string, reportType: string, sections: string[], format: string = 'json') {
    return this.request<ResearchReport>('/api/researcher/generate-report', 'POST', {
      symbol,
      report_type: reportType,
      sections,
      format
    });
  }

  async exportReport(reportId: string, format: string) {
    return this.request<ReportExport>(`/api/researcher/reports/${reportId}/export?format=${format}`, 'GET');
  }

  async searchResearch(query: string, searchType: string, limit: number = 10) {
    return this.request<ResearchSearchResult[]>(`/api/researcher/search?query=${encodeURIComponent(query)}&search_type=${searchType}&limit=${limit}`, 'GET');
  }

  async getTrendingResearch(limit: number = 10) {
    return this.request<ResearchSearchResult[]>(`/api/researcher/trending?limit=${limit}`, 'GET');
  }

  async getResearcherHealth() {
    return this.request<ResearcherHealth>('/api/researcher/health', 'GET');
  }
  */
  // ==================== UTILITY ENDPOINTS ====================

  async checkHealth() {
    return this.request<{ status: string }>('/health');
  }

  async getRoutes() {
    return this.request<string[]>('/routes');
  }
}

export const apiClient = new APIClient();
export default apiClient;
