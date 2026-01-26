import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  ChipProps
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Compare as CompareIcon,
  Public as PublicIcon,
  Newspaper as NewspaperIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { ResearcherStats } from '../components/researcher/ResearcherStats';
import { RecentResearch } from '../components/researcher/RecentResearch';
import { QuickActions } from '../components/researcher/QuickActions';

interface ResearcherStats {
  total_researches: number;
  total_reports: number;
  strategy_analyses: number;
  peer_comparisons: number;
  recent_activity: Array<{
    symbol: string;
    research_type: string;
    created_at: string;
  }>;
  symbols_researched: string[];
}

export const ResearcherHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ResearcherStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/researcher/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleResearch = () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }
    navigate(`/researcher/company/${symbol.toUpperCase()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleResearch();
    }
  };

  const quickActions = [
    {
      title: 'Company Deep Dive',
      description: 'Comprehensive company analysis with fundamentals, news, and AI insights',
      icon: <AssessmentIcon />,
      color: 'primary',
      onClick: () => navigate('/researcher/company/AAPL')
    },
    {
      title: 'Strategy Analysis',
      description: 'Analyze how well strategies fit current market conditions',
      icon: <TrendingUpIcon />,
      color: 'success',
      onClick: () => navigate('/researcher/strategy')
    },
    {
      title: 'Peer Comparison',
      description: 'Compare companies against industry peers and benchmarks',
      icon: <CompareIcon />,
      color: 'info',
      onClick: () => navigate('/researcher/compare')
    },
    {
      title: 'Macro Research',
      description: 'Get current macroeconomic environment and market outlook',
      icon: <PublicIcon />,
      color: 'warning',
      onClick: () => navigate('/researcher/macro')
    },
    {
      title: 'News Analysis',
      description: 'Aggregated news with sentiment analysis and impact assessment',
      icon: <NewspaperIcon />,
      color: 'secondary',
      onClick: () => navigate('/researcher/news')
    }
  ];

  const researchTypes: Array<{ type: string; label: string; icon: React.ReactNode; color: ChipProps['color'] }> = [
    { type: 'company', label: 'Company Research', icon: <AssessmentIcon fontSize="small" />, color: 'primary' },
    { type: 'strategy', label: 'Strategy Analysis', icon: <TrendingUpIcon fontSize="small" />, color: 'success' },
    { type: 'comparison', label: 'Peer Comparison', icon: <CompareIcon fontSize="small" />, color: 'info' },
    { type: 'macro', label: 'Macro Context', icon: <PublicIcon fontSize="small" />, color: 'warning' },
    { type: 'report', label: 'Report Generation', icon: <DownloadIcon fontSize="small" />, color: 'secondary' }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Market Researcher & Intelligence Platform
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Transform raw market data into strategic intelligence. Get comprehensive company analysis, 
                    strategy insights, peer comparisons, and macroeconomic context to make informed trading decisions.
                  </Typography>
                  
                  {/* Quick Symbol Search */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      onKeyPress={handleKeyPress}
                      error={!!error}
                      helperText={error}
                      InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleResearch}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                    >
                      Research
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {researchTypes.map((researchType) => (
                      <Chip
                        key={researchType.type}
                        icon={researchType.icon}
                        label={researchType.label}
                        color={researchType.color}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <QuickActions actions={quickActions} />
        </Grid>

        {/* Main Content Grid */}
        <Grid item xs={12} lg={8}>
          {/* Research Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ResearcherStats stats={stats} onRefresh={fetchStats} />
            </Grid>

            {/* Recent Research */}
            <Grid item xs={12}>
              <RecentResearch 
                activities={stats?.recent_activity || []}
                symbols={stats?.symbols_researched || []}
                onSymbolClick={(symbol) => navigate(`/researcher/company/${symbol}`)}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Research Tips */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Research Tips
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary="Start with a symbol" 
                        secondary="Enter any stock symbol to begin research" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TrendingUpIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary="Check strategy fit" 
                        secondary="Analyze how strategies work in current market" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CompareIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary="Compare peers" 
                        secondary="Benchmark against industry competitors" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PublicIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary="Monitor macro" 
                        secondary="Stay updated on economic indicators" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* API Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Sources Status
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Chip size="small" label="Active" color="success" /></ListItemIcon>
                      <ListItemText primary="Claude AI" secondary="Code generation & analysis" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Chip size="small" label="Active" color="success" /></ListItemIcon>
                      <ListItemText primary="Tavily Search" secondary="Web research & data" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Chip size="small" label="Active" color="success" /></ListItemIcon>
                      <ListItemText primary="Finnhub" secondary="Market data & news" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Chip size="small" label="Active" color="success" /></ListItemIcon>
                      <ListItemText primary="FMP" secondary="Financial statements" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResearcherHome;