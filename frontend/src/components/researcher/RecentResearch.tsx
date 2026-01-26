import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  IconButton,
  Tooltip,
  ChipProps
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Compare as CompareIcon,
  Public as PublicIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface RecentResearchProps {
  activities: Array<{
    symbol: string;
    research_type: string;
    created_at: string;
  }>;
  symbols: string[];
  onSymbolClick: (symbol: string) => void;
}

const getResearchTypeConfig = (type: string) => {
  const configs: Record<string, { icon: React.ReactNode; color: ChipProps['color']; label: string }> = {
    company: { icon: <AssessmentIcon fontSize="small" />, color: 'primary', label: 'Company' },
    strategy: { icon: <TrendingUpIcon fontSize="small" />, color: 'success', label: 'Strategy' },
    comparison: { icon: <CompareIcon fontSize="small" />, color: 'info', label: 'Comparison' },
    macro: { icon: <PublicIcon fontSize="small" />, color: 'warning', label: 'Macro' },
    report: { icon: <DownloadIcon fontSize="small" />, color: 'secondary', label: 'Report' }
  };
  
  return configs[type] || { icon: <HistoryIcon fontSize="small" />, color: 'default', label: type };
};

export const RecentResearch: React.FC<RecentResearchProps> = ({ activities, symbols, onSymbolClick }) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Research Activity
          </Typography>
          <Typography color="text.secondary">
            No recent research activity. Start by researching a company or generating a report.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Research Activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Last {activities.length} activities
          </Typography>
        </Box>
        
        <List>
          {activities.slice(0, 8).map((activity, index) => {
            const config = getResearchTypeConfig(activity.research_type);
            
            return (
              <ListItem key={index} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent', border: 1, borderColor: 'divider' }}>
                    {config.icon}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {activity.symbol}
                      </Typography>
                      <Chip
                        icon={config.icon}
                        label={config.label}
                        color={config.color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Box>
                  }
                />
                
                <Box display="flex" gap={1}>
                  <Tooltip title="View research">
                    <IconButton 
                      size="small"
                      onClick={() => onSymbolClick(activity.symbol)}
                    >
                      <AssessmentIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Symbols Summary */}
        {symbols.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Most Researched Symbols
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {symbols.slice(0, 8).map((symbol, index) => (
                <Chip
                  key={index}
                  label={symbol}
                  clickable
                  onClick={() => onSymbolClick(symbol)}
                  variant="outlined"
                  size="small"
                  color="primary"
                />
              ))}
              {symbols.length > 8 && (
                <Chip
                  label={`+${symbols.length - 8} more`}
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