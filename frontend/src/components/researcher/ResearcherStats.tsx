import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip, 
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Compare as CompareIcon,
  Public as PublicIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ResearcherStatsProps {
  stats: {
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
  } | null;
  onRefresh: () => void;
}

export const ResearcherStats: React.FC<ResearcherStatsProps> = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading statistics...</Typography>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Researches',
      value: stats.total_researches,
      icon: <AssessmentIcon />,
      color: 'primary'
    },
    {
      title: 'Reports Generated',
      value: stats.total_reports,
      icon: <TrendingUpIcon />,
      color: 'success'
    },
    {
      title: 'Strategy Analyses',
      value: stats.strategy_analyses,
      icon: <CompareIcon />,
      color: 'info'
    },
    {
      title: 'Peer Comparisons',
      value: stats.peer_comparisons,
      icon: <PublicIcon />,
      color: 'warning'
    }
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Research Statistics</Typography>
          <Tooltip title="Refresh statistics">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                border={1}
                borderColor="divider"
                borderRadius={1}
                bgcolor="background.paper"
              >
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
                <Chip
                  icon={stat.icon}
                  label=""
                  color={stat.color as any}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Symbols Researched */}
        {stats.symbols_researched.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Symbols Researched
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {stats.symbols_researched.slice(0, 10).map((symbol, index) => (
                <Chip
                  key={index}
                  label={symbol}
                  variant="outlined"
                  size="small"
                  color="primary"
                />
              ))}
              {stats.symbols_researched.length > 10 && (
                <Chip
                  label={`+${stats.symbols_researched.length - 10} more`}
                  variant="outlined"
                  size="small"
                  color="default"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};