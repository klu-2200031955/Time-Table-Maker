import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Alert,
  TextField
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const SubjectAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Subject Workload Edit States
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editSubjectItem, setEditSubjectItem] = useState(null);
  const [subjectPeriodsForm, setSubjectPeriodsForm] = useState(6);

  const [form, setForm] = useState({
    teacherId: '',
    subjectId: '',
    classes: [] // Class IDs
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, tRes, sRes, cRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/classes')
      ]);

      setAllocations(aRes.data);
      setTeachers(tRes.data);
      setSubjects(sRes.data);
      
      // Sort classes naturally for multi-select
      const sortedClasses = [...cRes.data].sort((a, b) => {
        const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.section.localeCompare(b.section);
      });
      setClasses(sortedClasses);
    } catch (err) {
      console.error('Failed to load allocations configuration data:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ teacherId: '', subjectId: '', classes: [] });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      teacherId: item.teacherId?._id || '',
      subjectId: item.subjectId?._id || '',
      classes: item.classes?.map(c => c._id) || []
    });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.teacherId || !form.subjectId || form.classes.length === 0) {
      setError('Please choose a Teacher, a Subject, and at least one Class Section.');
      return;
    }

    try {
      if (editItem) {
        const res = await api.put(`/allocations/${editItem._id}`, form);
        setAllocations(prev => prev.map(a => a._id === editItem._id ? res.data : a));
        setSuccess('Allocation updated successfully.');
      } else {
        const res = await api.post('/allocations', form);
        // If teacher-subject allocation existed, the backend appends classes to existing,
        // so we re-fetch to get clean synced state.
        await fetchData();
        setSuccess('Subject allocated successfully.');
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving allocation.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/allocations/${id}`);
      setAllocations(prev => prev.filter(a => a._id !== id));
      setSuccess('Allocation removed successfully.');
    } catch (err) {
      setError('Failed to delete allocation.');
    }
  };

  const handleOpenEditSubject = (item) => {
    setEditSubjectItem(item);
    setSubjectPeriodsForm(item.weeklyPeriods);
    setError('');
    setSuccess('');
    setSubjectDialogOpen(true);
  };

  const handleSaveSubjectPeriods = async () => {
    setError('');
    setSuccess('');
    if (!editSubjectItem) return;

    try {
      await api.put(`/subjects/${editSubjectItem._id}`, {
        subjectName: editSubjectItem.subjectName,
        subjectCode: editSubjectItem.subjectCode,
        weeklyPeriods: Number(subjectPeriodsForm)
      });
      setSuccess(`Updated periods required for ${editSubjectItem.subjectName} successfully.`);
      setSubjectDialogOpen(false);
      await fetchData(); // Refresh grid to update calculations and periods
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subject workload.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Subject Allocation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Assign teachers to specific subjects and class sections.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ bgcolor: '#1a237e', py: 1.2, px: 3, borderRadius: 2 }}
        >
          New Allocation
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Weekly Periods</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assigned Classes</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No subject allocations defined yet. Click "New Allocation" to setup.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {a.teacherId ? `${a.teacherId.fullName} (${a.teacherId.shortName})` : <span style={{color: 'red'}}>Deleted Teacher</span>}
                    </TableCell>
                    <TableCell>
                      {a.subjectId ? `${a.subjectId.subjectName} (${a.subjectId.subjectCode})` : <span style={{color: 'red'}}>Deleted Subject</span>}
                    </TableCell>
                    <TableCell>{a.subjectId?.weeklyPeriods || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {a.classes?.map((cls) => (
                          <Chip
                            key={cls._id}
                            label={`${cls.className}-${cls.section}`}
                            size="small"
                            variant="outlined"
                            sx={{ color: '#1a237e', borderColor: '#1a237e', fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(a)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(a._id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Predefined Subjects List Card */}
      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
          Predefined Subjects & Workloads
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Edit the number of weekly periods required for each subject. These configurations will apply across all classes.
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Subject Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Subject Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Weekly Periods Required</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                    <TableCell>{s.subjectCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{s.weeklyPeriods}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEditSubject(s)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          {editItem ? 'Edit Subject Allocation' : 'Create Subject Allocation'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="alloc-teacher-label">Select Teacher</InputLabel>
                <Select
                  labelId="alloc-teacher-label"
                  value={form.teacherId}
                  label="Select Teacher"
                  onChange={(e) => setForm(prev => ({ ...prev, teacherId: e.target.value }))}
                >
                  {teachers.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.fullName} ({t.shortName}) - {t.subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="alloc-subject-label">Select Subject</InputLabel>
                <Select
                  labelId="alloc-subject-label"
                  value={form.subjectId}
                  label="Select Subject"
                  onChange={(e) => {
                    const subId = e.target.value;
                    const activeSub = subjects.find(s => s._id === subId);
                    let filteredClasses = form.classes;
                    if (activeSub) {
                      filteredClasses = form.classes.filter(classId => {
                        const cls = classes.find(c => c._id === classId);
                        if (!cls) return false;
                        const classNum = parseInt(cls.className.replace(/\D/g, '')) || 0;
                        if (activeSub.subjectCode === 'GSCI' && classNum > 7) return false;
                        if ((activeSub.subjectCode === 'PHY' || activeSub.subjectCode === 'BIO') && classNum < 8) return false;
                        return true;
                      });
                    }
                    setForm(prev => ({ ...prev, subjectId: subId, classes: filteredClasses }));
                  }}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.subjectName} ({s.subjectCode}) - {s.weeklyPeriods} periods
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="alloc-classes-label">Assign Classes</InputLabel>
                <Select
                  labelId="alloc-classes-label"
                  multiple
                  value={form.classes}
                  onChange={(e) => setForm(prev => ({ ...prev, classes: e.target.value }))}
                  input={<OutlinedInput label="Assign Classes" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const cls = classes.find(c => c._id === value);
                        return cls ? (
                          <Chip key={value} label={`${cls.className}-${cls.section}`} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {(() => {
                    const activeSub = subjects.find(s => s._id === form.subjectId);
                    const eligibleClasses = classes.filter(c => {
                      if (!activeSub) return true;
                      const classNum = parseInt(c.className.replace(/\D/g, '')) || 0;
                      if (activeSub.subjectCode === 'GSCI') return classNum <= 7;
                      if (activeSub.subjectCode === 'PHY' || activeSub.subjectCode === 'BIO') return classNum >= 8;
                      return true;
                    });
                    return eligibleClasses.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        <Checkbox checked={form.classes.indexOf(c._id) > -1} />
                        <ListItemText primary={`${c.className}-${c.section}`} />
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#1a237e' }}>
            Save Allocation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subject Workload Dialog */}
      <Dialog open={subjectDialogOpen} onClose={() => setSubjectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Edit Subject Workload
        </DialogTitle>
        <DialogContent dividers>
          {editSubjectItem && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Update weekly periods for <strong>{editSubjectItem.subjectName} ({editSubjectItem.subjectCode})</strong>:
            </Typography>
          )}
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Weekly Periods Required"
                value={subjectPeriodsForm}
                onChange={(e) => setSubjectPeriodsForm(Number(e.target.value))}
                inputProps={{ min: 1, max: 20 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSubjectDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveSubjectPeriods} variant="contained" sx={{ bgcolor: '#1a237e' }}>
            Save Workload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectAllocation;
