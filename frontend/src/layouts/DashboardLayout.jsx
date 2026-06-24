import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Menu,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as GenerateIcon,
  GridOn as MasterIcon,
  Person as TeacherIcon,
  School as SchoolIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const DashboardLayout = () => {
  const { school, logout, academicYears, activeAcademicYear, setActiveAcademicYear } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Teachers', icon: <PeopleIcon />, path: '/teachers' },
    { text: 'Classes', icon: <ClassIcon />, path: '/classes' },
    { text: 'Subject Allocation', icon: <AssignmentIcon />, path: '/allocation' },
    { text: 'Generate Timetable', icon: <GenerateIcon />, path: '/generate-timetable' },
    { text: 'Master Timetable', icon: <MasterIcon />, path: '/master-timetable' },
    { text: 'Teacher Timetable', icon: <TeacherIcon />, path: '/teacher-timetable' },
    { text: 'Class Timetable', icon: <SchoolIcon />, path: '/class-timetable' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a237e', color: 'white' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2, bgcolor: '#0d1b2a' }}>
        <SchoolIcon sx={{ mr: 1, color: '#90caf9', fontSize: 32 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>
          TimeTable Maker
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  bgcolor: isSelected ? 'rgba(144, 202, 249, 0.16)' : 'transparent',
                  color: isSelected ? '#90caf9' : '#e0e0e0',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff'
                  },
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? '#90caf9' : '#b0bec5'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: isSelected ? 600 : 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: 'flex-start',
            borderColor: 'rgba(255,255,255,0.3)',
            color: '#ff8a80',
            '&:hover': {
              borderColor: '#ff8a80',
              bgcolor: 'rgba(255, 138, 128, 0.08)'
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: '#37474f',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, display: { xs: 'none', md: 'block' } }}>
              {school?.schoolName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {academicYears.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
                <Select
                  labelId="academic-year-select-label"
                  id="academic-year-select"
                  value={activeAcademicYear}
                  label="Academic Year"
                  onChange={(e) => setActiveAcademicYear(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  {academicYears.map((y) => (
                    <MenuItem key={y._id} value={y.academicYear}>
                      {y.academicYear}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Tooltip title="Account settings">
              <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ ml: 1 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#1a237e', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {school?.schoolName?.substring(0, 2).toUpperCase() || 'AD'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 2
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {school?.headmasterName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Headmaster
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>Settings</MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
