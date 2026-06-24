import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from 'react-toastify';

const Settings = () => {
  const { school, updateProfile, addAcademicYear, fetchAcademicYears } = useAuth();

  // Basic Info Form
  const [profileForm, setProfileForm] = useState({
    schoolName: '',
    headmasterName: '',
    mobile: '',
    email: ''
  });

  // Timings Form
  const [timingForm, setTimingForm] = useState({
    workingDays: [],
    periodsPerDay: 8,
    lunchAfterPeriod: 4,
    periodDuration: 45,
    assemblyStart: '',
    assemblyEnd: ''
  });

  // Academic Year Form
  const [newYearStr, setNewYearStr] = useState('');

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notifications state removed since we are using react-toastify

  useEffect(() => {
    if (school) {
      setProfileForm({
        schoolName: school.schoolName || '',
        headmasterName: school.headmasterName || '',
        mobile: school.mobile || '',
        email: school.email || ''
      });

      if (school.schoolTimings) {
        setTimingForm({
          workingDays: school.schoolTimings.workingDays || [],
          periodsPerDay: school.schoolTimings.periodsPerDay || 8,
          lunchAfterPeriod: school.schoolTimings.lunchAfterPeriod || 4,
          periodDuration: school.schoolTimings.periodDuration || 45,
          assemblyStart: school.schoolTimings.assemblyStart || '',
          assemblyEnd: school.schoolTimings.assemblyEnd || ''
        });
      }
    }
  }, [school]);

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      const result = await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (result.success) {
        toast.success('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(result.message || 'Failed to change password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    
    const result = await updateProfile(profileForm);
    if (result.success) {
      toast.success('School profile updated successfully!');
    } else {
      toast.error(result.message || 'Failed to update profile.');
    }
  };

  const handleTimingSave = async (e) => {
    e.preventDefault();

    if (timingForm.workingDays.length === 0) {
      toast.error('Please choose at least one working day.');
      return;
    }

    const result = await updateProfile({
      schoolTimings: timingForm
    });

    if (result.success) {
      toast.success('School timings updated successfully!');
    } else {
      toast.error(result.message || 'Failed to update timings.');
    }
  };

  const handleAddYear = async (e) => {
    e.preventDefault();

    if (!newYearStr || !/^\d{4}-\d{2}$/.test(newYearStr)) {
      toast.error('Academic Year must be in YYYY-YY format (e.g. 2026-27).');
      return;
    }

    const result = await addAcademicYear(newYearStr);
    if (result.success) {
      toast.success(`Academic year "${newYearStr}" added successfully.`);
      setNewYearStr('');
      await fetchAcademicYears();
    } else {
      toast.error(result.message || 'Failed to add academic year.');
    }
  };

  const handleDayToggle = (day) => {
    const current = timingForm.workingDays;
    const index = current.indexOf(day);
    let newDays = [...current];
    if (index === -1) {
      newDays.push(day);
    } else {
      newDays.splice(index, 1);
    }
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    newDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
    setTimingForm(prev => ({ ...prev, workingDays: newDays }));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          School Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure profile details, academic cycles, and default period schedules.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              School Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleProfileSave}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="School Name"
                    value={profileForm.schoolName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Headmaster Name"
                    value={profileForm.headmasterName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, headmasterName: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Mobile"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, mobile: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" sx={{ bgcolor: '#1a237e', px: 4 }}>
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Change Password */}
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handlePasswordSave}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" sx={{ bgcolor: '#1a237e', px: 4 }}>
                    Update Password
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Academic Years Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Academic Years
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleAddYear}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Add Academic Year (YYYY-YY)"
                    placeholder="e.g. 2026-27"
                    value={newYearStr}
                    onChange={(e) => setNewYearStr(e.target.value)}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button type="submit" variant="outlined" fullWidth sx={{ py: 1.8, fontWeight: 'bold' }}>
                    Add Year
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Timing Settings */}
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Timing & Schedule Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleTimingSave}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                      Working Days
                    </FormLabel>
                    <FormGroup>
                      <Grid container>
                        {days.map((day) => (
                          <Grid item xs={6} key={day}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={timingForm.workingDays.includes(day)}
                                  onChange={() => handleDayToggle(day)}
                                />
                              }
                              label={day}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </FormGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Periods Per Day"
                    value={timingForm.periodsPerDay}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, periodsPerDay: Number(e.target.value) }))}
                    inputProps={{ min: 4, max: 12 }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Period Duration (Mins)"
                    value={timingForm.periodDuration}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, periodDuration: Number(e.target.value) }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="lunch-settings-select">Lunch Break After Period</InputLabel>
                    <Select
                      labelId="lunch-settings-select"
                      value={timingForm.lunchAfterPeriod}
                      label="Lunch Break After Period"
                      onChange={(e) => setTimingForm(prev => ({ ...prev, lunchAfterPeriod: Number(e.target.value) }))}
                    >
                      {Array.from({ length: timingForm.periodsPerDay - 1 }, (_, i) => i + 1).map((n) => (
                        <MenuItem key={n} value={n}>
                          Period {n} (Lunch between P{n} & P{n+1})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Assembly Start"
                    value={timingForm.assemblyStart}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, assemblyStart: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Assembly End"
                    value={timingForm.assemblyEnd}
                    onChange={(e) => setTimingForm(prev => ({ ...prev, assemblyEnd: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" sx={{ bgcolor: '#1a237e', px: 4 }}>
                    Save Timings
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Settings;
