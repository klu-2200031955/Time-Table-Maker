import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    subjectName: '',
    subjectCode: '',
    weeklyPeriods: 6
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ subjectName: '', subjectCode: '', weeklyPeriods: 6 });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.subjectName || !form.subjectCode || !form.weeklyPeriods) {
      setError('All fields are required.');
      return;
    }

    try {
      if (editItem) {
        const res = await api.put(`/subjects/${editItem._id}`, form);
        setSubjects(prev => prev.map(s => s._id === editItem._id ? res.data : s));
        setSuccess('Subject updated successfully.');
      } else {
        const res = await api.post('/subjects', form);
        setSubjects(prev => [...prev, res.data]);
        setSuccess('Subject added successfully.');
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving subject.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? All allocations referencing this subject will be permanently deleted.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s._id !== id));
      setSuccess('Subject deleted successfully.');
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Subject Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure subjects and specify weekly period workload limits.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ bgcolor: '#1a237e', py: 1.2, px: 3, borderRadius: 2 }}
        >
          Add Subject
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No subjects configured yet. Click "Add Subject" to begin.
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{s.subjectName}</TableCell>
                    <TableCell>{s.subjectCode}</TableCell>
                    <TableCell>{s.weeklyPeriods}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(s)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(s._id)} size="small" color="error">
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          {editItem ? 'Edit Subject Details' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject Name"
                value={form.subjectName}
                onChange={(e) => setForm(prev => ({ ...prev, subjectName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Subject Code"
                value={form.subjectCode}
                onChange={(e) => setForm(prev => ({ ...prev, subjectCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. MAT"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Weekly Periods"
                value={form.weeklyPeriods}
                onChange={(e) => setForm(prev => ({ ...prev, weeklyPeriods: Number(e.target.value) }))}
                InputProps={{ inputProps: { min: 1, max: 20 } }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#1a237e' }}>
            Save Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subjects;
