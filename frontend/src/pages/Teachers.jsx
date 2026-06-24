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
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [form, setForm] = useState({
    fullName: '',
    shortName: '',
    subject: '',
    mobile: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/subjects')
      ]);
      setTeachers(tRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      console.error('Failed to load teachers or subjects:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ fullName: '', shortName: '', subject: '', mobile: '' });
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

    if (!form.fullName || !form.shortName || !form.subject) {
      setError('Full Name, Short Name, and Specialist Subject are required.');
      return;
    }

    try {
      if (editItem) {
        const res = await api.put(`/teachers/${editItem._id}`, form);
        setTeachers(prev => prev.map(t => t._id === editItem._id ? res.data : t));
        setSuccess('Teacher details updated successfully.');
      } else {
        const res = await api.post('/teachers', form);
        setTeachers(prev => [...prev, res.data]);
        setSuccess('Teacher added successfully.');
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher? All related subject allocations will be permanently removed.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t._id !== id));
      setSuccess('Teacher deleted successfully.');
    } catch (err) {
      setError('Failed to delete teacher.');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.shortName.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Faculty Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your school's teachers and department details.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ bgcolor: '#1a237e', py: 1.2, px: 3, borderRadius: 2 }}
        >
          Add Teacher
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', mb: 3 }}>
          <TextField
            size="small"
            label="Search by name, code, or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: <SearchIcon color="action" />
            }}
            sx={{ width: 350 }}
          />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Short Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Specialist Subject</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mobile Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No teachers found. Click "Add Teacher" to configure.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{t.fullName}</TableCell>
                    <TableCell>{t.shortName}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell>{t.mobile || '-'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(t)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(t._id)} size="small" color="error">
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
          {editItem ? 'Edit Teacher Details' : 'Add New Teacher'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Short Name (e.g. DSR)"
                value={form.shortName}
                onChange={(e) => setForm(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                placeholder="Initials"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel id="teacher-subject-select-label">Specialist Subject</InputLabel>
                <Select
                  labelId="teacher-subject-select-label"
                  value={form.subject}
                  label="Specialist Subject"
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
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
                value={form.mobile}
                onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
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

export default Teachers;
