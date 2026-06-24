import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

const Classes = () => {
  const { school } = useAuth();
  const [classes, setClasses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);


  const [form, setForm] = useState({
    className: 'Class 6',
    section: 'B'
  });

  const availableClasses = school?.schoolType === 'Primary School'
    ? ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
    : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  useEffect(() => {
    fetchClasses();
    if (school) {
      setForm(prev => ({
        ...prev,
        className: school.schoolType === 'Primary School' ? 'Class 1' : 'Class 6'
      }));
    }
  }, [school]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to load class sections:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({
      className: school?.schoolType === 'Primary School' ? 'Class 1' : 'Class 6',
      section: ''
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.className || !form.section) {
      toast.error('Both class grade and section are required.');
      return;
    }

    try {
      if (editItem) {
        const res = await api.put(`/classes/${editItem._id}`, form);
        setClasses(prev => prev.map(c => c._id === editItem._id ? res.data : c));
        toast.success('Class section updated successfully.');
      } else {
        const res = await api.post('/classes', form);
        setClasses(prev => [...prev, res.data]);
        toast.success('Class section added successfully.');
      }
      setDialogOpen(false);
      fetchClasses(); // Re-fetch to apply natural sorting
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred while saving.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section? All associated subject allocations and timetables will be permanently deleted.')) {
      return;
    }
    try {
      await api.delete(`/classes/${id}`);
      setClasses(prev => prev.filter(c => c._id !== id));
      toast.success('Class section deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete class section.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Class & Section Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure classes and sections. Each section behaves as an independent class in the scheduler.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ bgcolor: '#1a237e', py: 1.2, px: 3, borderRadius: 2 }}
        >
          Add Section
        </Button>
      </Box>

      {/* react-toastify will handle class settings alerts */}

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Class Grade</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Timetable Identifier</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No class sections configured. Click "Add Section" to configure.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.className}</TableCell>
                    <TableCell>{c.section}</TableCell>
                    <TableCell>{`${c.className}-${c.section}`}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(c)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(c._id)} size="small" color="error">
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
          {editItem ? 'Edit Class Section' : 'Add Class Section'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="class-select-label">Class Grade</InputLabel>
                <Select
                  labelId="class-select-label"
                  value={form.className}
                  label="Class Grade"
                  onChange={(e) => setForm(prev => ({ ...prev, className: e.target.value }))}
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
                value={form.section}
                onChange={(e) => setForm(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                placeholder="Single letter"
                inputProps={{ maxLength: 1 }}
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

export default Classes;
