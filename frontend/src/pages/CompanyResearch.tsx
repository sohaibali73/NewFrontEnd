import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Button, 
  LinearProgress, 
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Insights as InsightsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

interface CompanyResearchData {
  symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  description: string;
  fundamentals: {
    market_cap: number;
    pe_ratio: number;
    forward_pe: number;
    peg_ratio: number;
    price_to_book: number;
    price_to_sales: number;
    dividend_yield: number;
    earnings_growth: number;
    revenue_growth: number;
    roa: number;
    roe: number;
    debt_to_equity: number;
    current_ratio: number;
  };
  financial_health: {
    health_score: number;
    debt_to_equity: number;
    current_ratio: number;
    roe: number;
    roa: number;
    overall_health: string;
  };
  analyst_consensus: {
    target_price: number;
    ratings: { buy: number; hold: number; sell: number };
    sentiment: string;
    consensus: string;
  };
  insider_activity: {
    recent_buys: number;
    recent_sells: number;
    net_insider_position: number;
  };
  ai_summary: string;
  last_updated: string;
}

interface NewsArticle {
  headline: string;
  source: string;
  timestamp: string;
  sentiment: string;
  summary: string;
  url: string;
  sentiment_score: number;
}

export const CompanyResearch: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  
  const [research, setResearch] = useState<CompanyResearchData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (symbol) {
      fetchCompanyResearch(symbol);
      fetchNews(symbol);
    }
  }, [symbol]);

  const fetchCompanyResearch = async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/researcher/company', {
        symbol: symbol.toUpperCase(),
        include_news: true,
        include_insider: true,
        include_analyst: true
      });
      
      setResearch(response.data);
    } catch (err: any) {
      console.error('Failed to fetch company research:', err);
      setError(err.response?.data?.detail || 'Failed to fetch company research');
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async (symbol: string) => {
    try {
      const response = await api.post('/researcher/news', {
        symbol: symbol.toUpperCase(),
        limit: 10
      });
      setNews(response.data.news || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await api.post('/researcher/report', {
        symbol: symbol!,
        report_type: 'company',
        sections: ['executive_summary', 'fundamental_analysis', 'sentiment_analysis', 'risk_assessment', 'recommendations']
      });
      
      // Navigate to reports page or show success
      navigate('/researcher/reports');
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report: ' + err.response?.data?.detail);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return <SentimentSatisfiedIcon color="success" />;
      case 'negative': return <SentimentDissatisfiedIcon color="error" />;
      default: return <SentimentNeutralIcon color="warning" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'healthy': return 'success';
      case 'moderate': return 'warning';
      default: return 'error';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading && !research) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Researching {symbol}...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/researcher')}
          startIcon={<RefreshIcon />}
        >
          Back to Researcher
        </Button>
      </Box>
    );
  }

  if (!research) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No research data found for {symbol}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/researcher')}
          startIcon={<RefreshIcon />}
        >
          Back to Researcher
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography variant="h4" component="h1">
                      {research.company_name}
                    </Typography>
                    <Chip 
                      label={research.symbol} 
                      color="primary" 
                      variant="outlined" 
                      size="large"
                    />
                    <Chip 
                      label={research.sector} 
                      color="info" 
                      variant="outlined"
                    />
                    <Chip 
                      label={research.industry} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {research.description}
                  </Typography>
                  
                  {/* AI Summary */}
                  <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Analysis Summary
                    </Typography>
                    <Typography variant="body1">
                      {research.ai_summary}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(research.fundamentals.market_cap)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">P/E Ratio</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {research.fundamentals.pe_ratio.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Forward P/E</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {research.fundamentals.forward_pe.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Dividend Yield</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatPercentage(research.fundamentals.dividend_yield)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                      >
                        {generatingReport ? 'Generating...' : 'Generate Report'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => fetchCompanyResearch(symbol!)}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content Tabs */}
        <Grid item xs={12}>
          <Card>
            <Box borderBottom={1} borderColor="divider">
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                aria-label="company research tabs"
              >
                <Tab label="Fundamentals" icon={<AssessmentIcon />} />
                <Tab label="Financial Health" icon={<SecurityIcon />} />
                <Tab label="Analyst Consensus" icon={<PeopleIcon />} />
                <Tab label="Insider Activity" icon={<InsightsIcon />} />
                <Tab label="News & Sentiment" icon={<NewspaperIcon />} />
              </Tabs>
            </Box>
            
            <CardContent>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Fundamental Metrics</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Market Cap" 
                          secondary={formatCurrency(research.fundamentals.market_cap)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="P/E Ratio" 
                          secondary={research.fundamentals.pe_ratio.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Forward P/E" 
                          secondary={research.fundamentals.forward_pe.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="PEG Ratio" 
                          secondary={research.fundamentals.peg_ratio.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Price to Book" 
                          secondary={research.fundamentals.price_to_book.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Price to Sales" 
                          secondary={research.fundamentals.price_to_sales.toFixed(2)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Growth Metrics</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Earnings Growth" 
                          secondary={formatPercentage(research.fundamentals.earnings_growth)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Revenue Growth" 
                          secondary={formatPercentage(research.fundamentals.revenue_growth)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Return on Assets (ROA)" 
                          secondary={formatPercentage(research.fundamentals.roa)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Return on Equity (ROE)" 
                          secondary={formatPercentage(research.fundamentals.roe)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Dividend Yield" 
                          secondary={formatPercentage(research.fundamentals.dividend_yield)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Financial Health Score</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box width="100%" maxWidth={200}>
                        <LinearProgress 
                          variant="determinate" 
                          value={research.financial_health.health_score * 100} 
                          color={getHealthColor(research.financial_health.overall_health) as any}
                        />
                      </Box>
                      <Typography variant="h4" fontWeight="bold">
                        {(research.financial_health.health_score * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <Chip 
                      label={research.financial_health.overall_health.toUpperCase()} 
                      color={getHealthColor(research.financial_health.overall_health) as any}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Key Ratios</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Debt to Equity" 
                          secondary={research.financial_health.debt_to_equity.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Current Ratio" 
                          secondary={research.financial_health.current_ratio.toFixed(2)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Return on Equity (ROE)" 
                          secondary={formatPercentage(research.financial_health.roe)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Return on Assets (ROA)" 
                          secondary={formatPercentage(research.financial_health.roa)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              )}

              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Analyst Consensus</Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Chip 
                        label={research.analyst_consensus.consensus} 
                        color="primary" 
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Target Price: {formatCurrency(research.analyst_consensus.target_price)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip 
                        icon={<SentimentSatisfiedIcon />}
                        label={`Buy: ${research.analyst_consensus.ratings.buy}`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<SentimentNeutralIcon />}
                        label={`Hold: ${research.analyst_consensus.ratings.hold}`}
                        color="warning"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<SentimentDissatisfiedIcon />}
                        label={`Sell: ${research.analyst_consensus.ratings.sell}`}
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Market Sentiment</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      {getSentimentIcon(research.analyst_consensus.sentiment)}
                      <Typography variant="h6" fontWeight="bold">
                        {research.analyst_consensus.sentiment.toUpperCase()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {activeTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Insider Activity</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Recent Buys" 
                          secondary={research.insider_activity.recent_buys} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Recent Sells" 
                          secondary={research.insider_activity.recent_sells} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Net Insider Position" 
                          secondary={research.insider_activity.net_insider_position.toLocaleString()} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Insider Analysis</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Insider trading activity can indicate management's confidence in the company's future.
                      Positive net insider activity often signals bullish sentiment.
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {activeTab === 4 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Recent News</Typography>
                    {news.length === 0 ? (
                      <Typography color="text.secondary">No recent news available.</Typography>
                    ) : (
                      <List>
                        {news.map((article, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              {getSentimentIcon(article.sentiment)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {article.headline}
                                  </Typography>
                                  <Chip
                                    label={article.sentiment.toUpperCase()}
                                    color={article.sentiment === 'positive' ? 'success' : article.sentiment === 'negative' ? 'error' : 'warning'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {article.source} • {new Date(article.timestamp).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" component="div">
                                    {article.summary}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyResearch;