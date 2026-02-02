import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { TabProvider } from './contexts/TabContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { AFLGeneratorPage } from './pages/AFLGeneratorPage';
import { ChatPage } from './pages/ChatPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { BacktestPage } from './pages/BacktestPage';
import { ReverseEngineerPage } from './pages/ReverseEngineerPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import Researcher from './pages/Researcher';
import { CompanyResearch } from './pages/CompanyResearchPage';
import { StrategyAnalysis } from './pages/StrategyAnalysis';
import { PeerComparison } from './pages/PeerComparison';
import TrainingPage from './pages/TrainingPage';

function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <TabProvider>
                      <MainLayout />
                    </TabProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="afl" element={<AFLGeneratorPage />} />
                <Route path="afl-generator" element={<AFLGeneratorPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="knowledge" element={<KnowledgeBasePage />} />
                <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="backtest" element={<BacktestPage />} />
                <Route path="reverse-engineer" element={<ReverseEngineerPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="researcher" element={<Researcher />} />
                <Route path="researcher/company/:symbol" element={<CompanyResearch />} />
                <Route path="researcher/strategy" element={<StrategyAnalysis />} />
                <Route path="researcher/compare" element={<PeerComparison />} />
                <Route path="training" element={<TrainingPage />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}

export default App;