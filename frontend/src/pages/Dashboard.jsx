import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  People as PeopleIcon,
  Book as BookIcon,
  Class as ClassIcon,
  AutoAwesome as GenerateIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeAcademicYear } = useAuth();
  
  const [stats, setStats] = useState({
    academicYear: activeAcademicYear || 'N/A',
    totalTeachers: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalSections: 0,
    totalTimetables: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [activeAcademicYear]);

  const fetchDashboardStats = async () => {
    try {
      const tRes = await api.get('/teachers');
      const sRes = await api.get('/subjects');
      const cRes = await api.get('/classes');
      const ttRes = await api.get(`/timetable?academicYear=${activeAcademicYear}`);

      // Calculate total classes and sections
      // classes from backend are distinct sections (e.g. 6-A, 6-B)
      const classesDistinct = new Set(cRes.data.map(c => c.className));

      setStats({
        academicYear: activeAcademicYear,
        totalTeachers: tRes.data.length,
        totalSubjects: sRes.data.length,
        totalClasses: classesDistinct.size,
        totalSections: cRes.data.length,
        totalTimetables: ttRes.data.length > 0 ? cRes.data.length : 0 // Number of schedules class-wise
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  };

  const statCards = [
    { title: 'Academic Year', value: stats.academicYear, icon: <CalendarIcon fontSize="large" />, color: '#1565c0' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: <PeopleIcon fontSize="large" />, color: '#2e7d32' },
    { title: 'Total Subjects', value: stats.totalSubjects, icon: <BookIcon fontSize="large" />, color: '#e65100' },
    { title: 'Total Classes', value: stats.totalClasses, icon: <ClassIcon fontSize="large" />, color: '#d84315' },
    { title: 'Total Sections', value: stats.totalSections, icon: <ClassIcon fontSize="large" />, color: '#4527a0' },
    { title: 'Generated Schedules', value: stats.totalTimetables > 0 ? 'Generated' : 'Not Generated', icon: <GenerateIcon fontSize="large" />, color: stats.totalTimetables > 0 ? '#00695c' : '#c62828' }
  ];

  const quickActions = [
    { label: 'Add Teacher', onClick: () => navigate('/teachers'), icon: <PeopleIcon /> },
    { label: 'Allocate Subjects', onClick: () => navigate('/allocation'), icon: <ArrowForwardIcon /> },
    { label: 'Generate Timetable', onClick: () => navigate('/generate-timetable'), icon: <GenerateIcon /> },
    { label: 'View Reports', onClick: () => navigate('/reports'), icon: <ReportsIcon /> },
    { label: 'School Settings', onClick: () => navigate('/settings'), icon: <SettingsIcon /> }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your school timetable control panel.
        </Typography>
      </Box>

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ borderLeft: `6px solid ${card.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#37474f' }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ color: card.color }}>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {quickActions.map((action, idx) => (
                <Grid item xs={6} key={idx}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.onClick}
                    sx={{
                      py: 1.5,
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      borderColor: 'rgba(0,0,0,0.12)',
                      color: '#37474f',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(26, 35, 126, 0.04)',
                        borderColor: '#1a237e',
                        color: '#1a237e'
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Status Check / Alert Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Timetable Status Check
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemIcon sx={{ color: stats.totalTeachers > 0 ? 'success.main' : 'error.main' }}>
                  ●
                </ListItemIcon>
                <ListItemText
                  primary="Faculty setup"
                  secondary={stats.totalTeachers > 0 ? `${stats.totalTeachers} teachers registered.` : 'No teachers registered.'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: stats.totalSubjects > 0 ? 'success.main' : 'error.main' }}>
                  ●
                </ListItemIcon>
                <ListItemText
                  primary="Subjects setup"
                  secondary={stats.totalSubjects > 0 ? `${stats.totalSubjects} subjects configured.` : 'No subjects configured.'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: stats.totalSections > 0 ? 'success.main' : 'error.main' }}>
                  ●
                </ListItemIcon>
                <ListItemText
                  primary="Class structure"
                  secondary={stats.totalSections > 0 ? `${stats.totalSections} active class sections.` : 'No sections configured.'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: stats.totalTimetables > 0 ? 'success.main' : 'warning.main' }}>
                  ●
                </ListItemIcon>
                <ListItemText
                  primary="Timetable Generation"
                  secondary={stats.totalTimetables > 0 ? 'Timetable generated successfully.' : 'Timetable not yet generated for the current academic year.'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
