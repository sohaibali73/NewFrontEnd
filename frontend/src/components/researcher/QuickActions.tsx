import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box,
  Chip
} from '@mui/material';
import { 
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Compare as CompareIcon,
  Public as PublicIcon,
  Newspaper as NewspaperIcon
} from '@mui/icons-material';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'info' | 'warning' | 'secondary';
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const getIconForColor = (color: string) => {
    switch (color) {
      case 'primary': return <AssessmentIcon />;
      case 'success': return <TrendingUpIcon />;
      case 'info': return <CompareIcon />;
      case 'warning': return <PublicIcon />;
      case 'secondary': return <NewspaperIcon />;
      default: return <AssessmentIcon />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                display="flex"
                flexDirection="column"
                height="100%"
                border={1}
                borderColor="divider"
                borderRadius={2}
                p={2}
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}.light`,
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Chip
                    icon={action.icon}
                    label={action.title}
                    color={action.color as any}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {action.description}
                </Typography>
                
                <Box mt="auto">
                  <Button
                    variant="outlined"
                    color={action.color as any}
                    onClick={action.onClick}
                    fullWidth
                    endIcon={getIconForColor(action.color)}
                    sx={{ textTransform: 'none' }}
                  >
                    Start Research
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};