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
  // Generative UI types (Vercel AI SDK style)
  MessagePart,
  Artifact,
} from '@/types/api';

// API Base URL - use environment variable or production URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://potomac-analyst-workbench-production.up.railway.app';

class APIClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (e) {
      // localStorage access might fail in certain contexts (SecurityError)
      this.token = null;
    }
  }

  private setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  private getToken() {
    try {
      return localStorage.getItem('auth_token');
    } catch (e) {
      // Return null if localStorage access fails
      return null;
    }
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
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (e) {
      // Silently fail if localStorage is not available
    }
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

  // AFL File Upload/Management
  async uploadAflFile(formData: FormData) {
    return this.request<{ file_id: string; filename: string; content_type: string }>('/afl/upload-file', 'POST', formData, true, 60000);
  }

  async deleteAflFile(fileId: string) {
    return this.request<{ success: boolean }>(`/afl/files/${fileId}`, 'DELETE');
  }

  async getAflFiles() {
    return this.request<{ id: string; filename: string; uploaded_at: string }[]>('/afl/files');
  }

  // ==================== CHAT ENDPOINTS ====================

  async getConversations() {
    return this.request<Conversation[]>('/chat/conversations');
  }

  async createConversation() {
    return this.request<Conversation>('/chat/conversations', 'POST', {});
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async deleteConversation(conversationId: string) {
    return this.request<{ success: boolean }>(`/chat/conversations/${conversationId}`, 'DELETE');
  }

  async sendMessage(content: string, conversationId?: string) {
    // AI response needs longer timeout - 2 minutes
    // Returns Vercel AI SDK style response with parts for Generative UI rendering
    return this.request<{
      conversation_id: string;
      response: string;
      tools_used?: any[];
      parts?: MessagePart[];      // AI SDK Generative UI parts array
      all_artifacts?: Artifact[]; // Legacy artifact support
    }>('/chat/message', 'POST', {
      content,
      conversation_id: conversationId,
    }, false, 120000);
  }

  /**
   * Send a message with streaming response using Vercel AI SDK Data Stream Protocol.
   * 
   * This method returns a ReadableStream that emits chunks in the AI SDK format:
   * - Text chunks (0:)
   * - Tool calls (9:)
   * - Tool results (a:)
   * - Custom data (2:)
   * - Finish message (d:)
   * 
   * Use the useStreamingChat hook for automatic stream parsing.
   */
  async sendMessageStream(
    content: string,
    conversationId?: string,
    options?: {
      onText?: (text: string) => void;
      onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
      onToolResult?: (toolCallId: string, result: any) => void;
      onData?: (data: any) => void;
      onError?: (error: string) => void;
      onFinish?: (finishReason: string, usage: { promptTokens: number; completionTokens: number }) => void;
      signal?: AbortSignal;
    }
  ): Promise<{ conversationId: string }> {
    const token = this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const newConversationId = response.headers.get('X-Conversation-Id') || conversationId || '';

    // Parse the stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    const parseChunk = (chunk: string): { type: string; data: any } | null => {
      const match = chunk.match(/^([0-9a-e]):(.+)$/);
      if (!match) return null;
      
      const [, typeCode, jsonData] = match;
      const typeMap: Record<string, string> = {
        '0': 'text',
        '2': 'data',
        '3': 'error',
        '9': 'tool_call',
        'a': 'tool_result',
        'd': 'finish_message',
        'e': 'finish_step',
      };
      
      try {
        return { type: typeMap[typeCode] || 'unknown', data: JSON.parse(jsonData) };
      } catch {
        return null;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = parseChunk(line);
        if (!parsed) continue;

        switch (parsed.type) {
          case 'text':
            options?.onText?.(parsed.data);
            break;
          case 'tool_call':
            options?.onToolCall?.(parsed.data.toolCallId, parsed.data.toolName, parsed.data.args);
            break;
          case 'tool_result':
            options?.onToolResult?.(parsed.data.toolCallId, parsed.data.result);
            break;
          case 'data':
            options?.onData?.(Array.isArray(parsed.data) ? parsed.data[0] : parsed.data);
            break;
          case 'error':
            options?.onError?.(parsed.data);
            break;
          case 'finish_message':
            options?.onFinish?.(parsed.data.finishReason, parsed.data.usage);
            break;
        }
      }
    }

    return { conversationId: newConversationId };
  }

  /**
   * Get the streaming endpoint URL for direct use with fetch or EventSource
   */
  getStreamEndpoint(): string {
    return `${API_BASE_URL}/chat/stream`;
  }

  async uploadFile(conversationId: string, formData: FormData) {
    // File upload needs longer timeout for large files
    return this.request<{ file_id: string; filename: string }>(`/chat/conversations/${conversationId}/upload`, 'POST', formData, true, 60000);
  }

  async getChatTools() {
    return this.request<{ name: string; description: string }[]>('/chat/tools');
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

  async startReverseEngineering(query: string) {
    // AI analysis needs longer timeout
    return this.request<Strategy>('/reverse-engineer/start', 'POST', { query }, false, 90000);
  }

  async continueReverseEngineering(strategyId: string, message: string) {
    // AI response needs longer timeout
    return this.request<Strategy>('/reverse-engineer/continue', 'POST', {
      strategy_id: strategyId,
      message,
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

// Compatibility layer for pages expecting 'api'
export const api = {
  auth: {
    login: (email: string, password: string) => apiClient.login(email, password),
    register: (data: any) => apiClient.register(data.email, data.password, data.name, data.claude_api_key, data.tavily_api_key),
    getMe: () => apiClient.getCurrentUser(),
  },
  afl: {
    generate: (prompt: string, strategyType?: string, settings?: any) =>
      apiClient.generateAFL({ prompt, strategy_type: strategyType as any, settings }),
    optimize: (code: string) => apiClient.optimizeAFL(code),
    debug: (code: string, errorMessage?: string) => apiClient.debugAFL(code, errorMessage),
    explain: (code: string) => apiClient.explainAFL(code),
    validate: (code: string) => apiClient.validateAFL(code),
    getCodes: () => apiClient.getAFLCodes(),
    getCode: (codeId: string) => apiClient.getAFLCode(codeId),
    deleteCode: (codeId: string) => apiClient.deleteAFLCode(codeId),
  },
  chat: {
    getConversations: () => apiClient.getConversations(),
    createConversation: () => apiClient.createConversation(),
    getMessages: (conversationId: string) => apiClient.getMessages(conversationId),
    deleteConversation: (conversationId: string) => apiClient.deleteConversation(conversationId),
    sendMessage: (content: string, conversationId?: string) => apiClient.sendMessage(content, conversationId),
    sendMessageStream: (content: string, conversationId?: string, options?: any) => apiClient.sendMessageStream(content, conversationId, options),
    getStreamEndpoint: () => apiClient.getStreamEndpoint(),
    getTools: () => apiClient.getChatTools(),
  },
  brain: {
    uploadDocument: (file: File, category?: string) => apiClient.uploadDocument(file, undefined, category),
    search: (query: string, category?: string, limit?: number) => apiClient.searchKnowledge(query, category, limit),
    getDocuments: () => apiClient.getDocuments(),
    getStats: () => apiClient.getBrainStats(),
    deleteDocument: (documentId: string) => apiClient.deleteDocument(documentId),
  },
  backtest: {
    upload: (file: File, strategyId?: string) => apiClient.uploadBacktest(file, strategyId),
    getBacktest: (backtestId: string) => apiClient.getBacktest(backtestId),
    getStrategyBacktests: (strategyId: string) => apiClient.getStrategyBacktests(strategyId),
  },
  reverseEngineer: {
    startSession: (query: string) => apiClient.startReverseEngineering(query),
    continue: (strategyId: string, message: string) => apiClient.continueReverseEngineering(strategyId, message),
    research: (strategyId: string) => apiClient.researchStrategy(strategyId),
    generateSchematic: (strategyId: string) => apiClient.generateStrategySchematic(strategyId),
    generateCode: (strategyId: string) => apiClient.generateStrategyCode(strategyId),
    getStrategy: (strategyId: string) => apiClient.getStrategy(strategyId),
  },
  train: {
    submitFeedback: (feedback: FeedbackCreateRequest) => apiClient.submitFeedback(feedback),
    getMyFeedback: () => apiClient.getMyFeedback(),
    getFeedback: (feedbackId: string) => apiClient.getFeedback(feedbackId),
    testTraining: (request: TrainingTestRequest) => apiClient.testTraining(request),
    getEffectiveness: () => apiClient.getTrainingEffectiveness(),
    suggest: (suggestion: SuggestionCreateRequest) => apiClient.suggestTraining(suggestion),
    getMySuggestions: () => apiClient.getMySuggestions(),
    getLearningCurve: () => apiClient.getLearningCurve(),
    getPopularPatterns: () => apiClient.getPopularPatterns(),
    searchKnowledge: (query: string, category?: TrainingCategory, limit?: number) =>
      apiClient.searchTrainingKnowledge(query, category, limit),
    getCategories: () => apiClient.getKnowledgeCategories(),
    getTypes: () => apiClient.getTrainingTypes(),
    quickLearn: (code: string, explanation: string) => apiClient.quickLearn(code, explanation),
    getStats: () => apiClient.getTrainStats(),
  },
  admin: {
    getStatus: () => apiClient.getAdminStatus(),
    makeAdmin: (userId: string) => apiClient.makeAdmin(userId),
    revokeAdmin: (userId: string) => apiClient.revokeAdmin(userId),
    // Training
    addTraining: (training: TrainingCreateRequest) => apiClient.addTraining(training),
    quickTrain: (request: QuickTrainRequest) => apiClient.quickTrain(request),
    addCorrection: (correction: CorrectionRequest) => apiClient.addCorrection(correction),
    batchImport: (items: TrainingCreateRequest[]) => apiClient.batchImportTraining(items),
    getTrainingList: (params?: any) => apiClient.getTrainingList(params),
    getTraining: (id: string) => apiClient.getTraining(id),
    updateTraining: (id: string, updates: any) => apiClient.updateTraining(id, updates),
    deleteTraining: (id: string) => apiClient.deleteTraining(id),
    toggleTraining: (id: string) => apiClient.toggleTraining(id),
    getTrainingStats: () => apiClient.getTrainingStatsOverview(),
    exportTraining: (params?: any) => apiClient.exportTraining(params),
    previewContext: (category?: TrainingCategory) => apiClient.previewTrainingContext(category),
    // Users
    getUsers: () => apiClient.getUsers(),
    getUser: (id: string) => apiClient.getUser(id),
    deleteUser: (id: string) => apiClient.deleteUser(id),
    // Feedback
    getAllFeedback: (params?: any) => apiClient.getAllFeedback(params),
    getFeedback: (id: string) => apiClient.getAdminFeedback(id),
    reviewFeedback: (id: string, review: FeedbackReviewRequest) => apiClient.reviewFeedback(id, review),
    // Suggestions
    getAllSuggestions: (status?: SuggestionStatus) => apiClient.getAllSuggestions(status),
    getSuggestion: (id: string) => apiClient.getSuggestion(id),
    reviewSuggestion: (id: string, review: SuggestionReviewRequest) => apiClient.reviewSuggestion(id, review),
    approveSuggestion: (id: string, priority?: number) => apiClient.approveSuggestion(id, priority),
    rejectSuggestion: (id: string, reason?: string) => apiClient.rejectSuggestion(id, reason),
    // Analytics
    getAnalytics: () => apiClient.getAnalyticsOverview(),
    getTrends: () => apiClient.getAnalyticsTrends(),
    // Config
    getConfig: () => apiClient.getAdminConfig(),
    addAdminEmail: (email: string) => apiClient.addAdminEmail(email),
  },
};