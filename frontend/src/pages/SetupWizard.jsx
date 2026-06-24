import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const steps = ['Faculty Setup', 'Class Sections', 'Timing Setup'];

const SetupWizard = () => {
  const navigate = useNavigate();
  const { school, updateProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  // General state
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // Search/Filters
  const [searchTeacher, setSearchTeacher] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'teacher', 'class'
  const [editItem, setEditItem] = useState(null);

  // Form States
  const [teacherForm, setTeacherForm] = useState({ fullName: '', shortName: '', subject: '', mobile: '' });
  const [classForm, setClassForm] = useState({ className: 'Class 6', section: 'B' });

  // School timings form
  const [timingForm, setTimingForm] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    periodsPerDay: 8,
    lunchAfterPeriod: 4,
    periodDuration: 45,
    assemblyStart: '08:45 AM',
    assemblyEnd: '09:00 AM'
  });

  const availableClasses = school?.schoolType === 'Primary School'
    ? ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
    : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  useEffect(() => {
    if (school) {
      fetchData();
      
      // Pre-set className in class form matching school type
      if (school.schoolType === 'Primary School') {
        setClassForm(prev => ({ ...prev, className: 'Class 1' }));
      }
    }
  }, [school]);

  const fetchData = async () => {
    try {
      const tRes = await api.get('/teachers');
      const cRes = await api.get('/classes');
      const sRes = await api.get('/subjects');
      setTeachers(tRes.data);
      setClasses(cRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      console.error('Failed to load wizard setup data:', err);
    }
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Step 3: Timing Setup - save profile
      try {
        const payload = {
          schoolTimings: timingForm
        };
        const result = await updateProfile(payload);
        if (result.success) {
          toast.success('School settings updated successfully!');
          navigate('/');
        } else {
          toast.error(result.message || 'Failed to save school timings settings.');
        }
      } catch (err) {
        toast.error('Failed to save school timings settings.');
      }
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Dialog Control
  const openAddDialog = (type) => {
    setDialogType(type);
    setEditItem(null);
    if (type === 'teacher') setTeacherForm({ fullName: '', shortName: '', subject: '', mobile: '' });
    if (type === 'class') setClassForm({ className: availableClasses[0], section: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (type, item) => {
    setDialogType(type);
    setEditItem(item);
    if (type === 'teacher') setTeacherForm({ ...item });
    if (type === 'class') setClassForm({ ...item });
    setDialogOpen(false); // Make sure closed
    setDialogOpen(true);
  };

  const handleDialogSave = async () => {
    try {
      if (dialogType === 'teacher') {
        if (editItem) {
          const res = await api.put(`/teachers/${editItem._id}`, teacherForm);
          setTeachers(prev => prev.map(t => t._id === editItem._id ? res.data : t));
          toast.success('Teacher updated successfully!');
        } else {
          const res = await api.post('/teachers', teacherForm);
          setTeachers(prev => [...prev, res.data]);
          toast.success('Teacher added successfully!');
        }
      } else if (dialogType === 'class') {
        if (editItem) {
          const res = await api.put(`/classes/${editItem._id}`, classForm);
          setClasses(prev => prev.map(c => c._id === editItem._id ? res.data : c));
          toast.success('Class section updated successfully!');
        } else {
          const res = await api.post('/classes', classForm);
          setClasses(prev => [...prev, res.data]);
          toast.success('Class section added successfully!');
        }
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred while saving item.');
    }
  };

  const handleDeleteItem = async (type, id) => {
    try {
      if (type === 'teacher') {
        await api.delete(`/teachers/${id}`);
        setTeachers(prev => prev.filter(t => t._id !== id));
        toast.success('Teacher deleted successfully!');
      } else if (type === 'class') {
        await api.delete(`/classes/${id}`);
        setClasses(prev => prev.filter(c => c._id !== id));
        toast.success('Class section deleted successfully!');
      }
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  // Checkbox handler for timing days
  const handleDayToggle = (day) => {
    const current = timingForm.workingDays;
    const index = current.indexOf(day);
    let newDays = [...current];
    if (index === -1) {
      newDays.push(day);
    } else {
      newDays.splice(index, 1);
    }
    // Maintain standard order
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    newDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
    setTimingForm(prev => ({ ...prev, workingDays: newDays }));
  };

  // Render Steps
  const renderStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Faculty Setup
        const filteredTeachers = teachers.filter(t =>
          t.fullName.toLowerCase().includes(searchTeacher.toLowerCase()) ||
          t.shortName.toLowerCase().includes(searchTeacher.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTeacher.toLowerCase())
        );

        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small"
                label="Search Teacher"
                value={searchTeacher}
                onChange={(e) => setSearchTeacher(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />
                }}
                sx={{ width: 250 }}
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAddDialog('teacher')} sx={{ bgcolor: '#1a237e' }}>
                Add Teacher
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Short Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Specialist Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No teachers added yet. Click "Add Teacher" above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell>{t.fullName}</TableCell>
                        <TableCell>{t.shortName}</TableCell>
                        <TableCell>{t.subject}</TableCell>
                        <TableCell>{t.mobile || '-'}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => openEditDialog('teacher', t)} size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteItem('teacher', t._id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 1: // Class Sections Setup
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                We've pre-seeded class sections with section <strong>'A'</strong> for classes of your school type. You can add additional sections (e.g. B, C) below.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAddDialog('class')} sx={{ bgcolor: '#1a237e', minWidth: 150 }}>
                Add Section
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Class Grade</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Timetable Display Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No class sections setup. Click "Add Section".
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>{c.className}</TableCell>
                        <TableCell>{c.section}</TableCell>
                        <TableCell>{`${c.className}-${c.section}`}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => openEditDialog('class', c)} size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                          {classes.length > 5 && (
                            <IconButton onClick={() => handleDeleteItem('class', c._id)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2: // School Timing Setup
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return (
          <Box>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
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

              <Grid item xs={12} md={6}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Periods Per Day"
                      value={timingForm.periodsPerDay}
                      onChange={(e) => setTimingForm(prev => ({ ...prev, periodsPerDay: Number(e.target.value) }))}
                      InputProps={{ inputProps: { min: 4, max: 12 } }}
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
                      <InputLabel id="lunch-select-label">Lunch Break After Period</InputLabel>
                      <Select
                        labelId="lunch-select-label"
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
                      label="Assembly Start Time"
                      value={timingForm.assemblyStart}
                      onChange={(e) => setTimingForm(prev => ({ ...prev, assemblyStart: e.target.value }))}
                      placeholder="e.g. 08:45 AM"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Assembly End Time"
                      value={timingForm.assemblyEnd}
                      onChange={(e) => setTimingForm(prev => ({ ...prev, assemblyEnd: e.target.value }))}
                      placeholder="e.g. 09:00 AM"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown Step';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f4f6f8',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Card sx={{ maxWidth: 900, width: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
              First Time Setup Wizard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Configure your school settings step by step to start generating timetables.
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* react-toastify will handle all wizard notification alerts */}

          <Box sx={{ minHeight: 280, mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ color: '#546e7a', fontWeight: 'bold' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                bgcolor: '#1a237e',
                fontWeight: 'bold',
                px: 4,
                py: 1,
                borderRadius: 2,
                '&:hover': { bgcolor: '#0d47a1' }
              }}
            >
              {activeStep === steps.length - 1 ? 'Finish & View Dashboard' : 'Next Step'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* dialog for adding and editing */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          {editItem ? 'Edit Details' : 'Add New Record'}
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'teacher' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teacher Full Name"
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Short Name (e.g. KSP)"
                  value={teacherForm.shortName}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, shortName: e.target.value }))}
                  placeholder="3-4 Letter Initials"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel id="wizard-teacher-subject-label">Specialist Subject</InputLabel>
                  <Select
                    labelId="wizard-teacher-subject-label"
                    value={teacherForm.subject}
                    label="Specialist Subject"
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    {subjects.map((sub) => (
                      <MenuItem key={sub._id} value={sub.subjectName}>
                        {sub.subjectName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mobile Number (Optional)"
                  value={teacherForm.mobile}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </Grid>
            </Grid>
          )}

          {dialogType === 'class' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="grade-select-label">Class Grade</InputLabel>
                  <Select
                    labelId="grade-select-label"
                    value={classForm.className}
                    label="Class Grade"
                    onChange={(e) => setClassForm(prev => ({ ...prev, className: e.target.value }))}
                  >
                    {availableClasses.map((item) => (
                      <MenuItem key={item} value={item}>{item}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Section (e.g. B, C)"
                  value={classForm.section}
                  onChange={(e) => setClassForm(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                  placeholder="Single letter"
                  inputProps={{ maxLength: 1 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDialogSave} variant="contained" sx={{ bgcolor: '#1a237e' }}>
            Save Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SetupWizard;
