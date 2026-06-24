import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField
} from '@mui/material';
import {
  AutoAwesome as GenerateIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const GenerateTimetable = () => {
  const { school, activeAcademicYear } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState([]); // List of cells
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Quick Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null); // { day, period }
  const [editForm, setEditForm] = useState({
    subject: '',
    isCustomSubject: false,
    customSubjectName: '',
    teacherShortName: '',
    isLocked: false
  });

  // Drag and Drop States
  const [draggedCell, setDraggedCell] = useState(null); // { day, period }

  useEffect(() => {
    fetchMetadata();
  }, [activeAcademicYear]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable();
    }
  }, [selectedClassId, activeAcademicYear]);

  const fetchMetadata = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, tRes, sRes, aRes] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/allocations')
      ]);
      setClasses(cRes.data);
      setTeachers(tRes.data);
      setSubjects(sRes.data);
      setAllocations(aRes.data);
    } catch (err) {
      setError('Failed to load setup configurations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    const activeClass = classes.find(c => c._id === selectedClassId);
    if (!activeClass) return;

    try {
      const res = await api.get(
        `/timetable?academicYear=${activeAcademicYear}&className=${activeClass.className}&section=${activeClass.section}`
      );
      setTimetable(res.data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/generate', { academicYear: activeAcademicYear });
      toast.success('Timetable generated successfully for all classes!');
      
      // Filter current class entries
      const activeClass = classes.find(c => c._id === selectedClassId);
      if (activeClass) {
        const currentClassEntries = res.data.filter(
          item => item.className === activeClass.className && item.section === activeClass.section
        );
        setTimetable(currentClassEntries);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate timetable automatically.');
    } finally {
      setGenerating(false);
    }
  };

  // Convert flat timetable records into grid mapping
  // grid[day][period] = { subject, teacherShortName, isLocked }
  const getGridData = () => {
    const grid = {};
    if (!school) return grid;

    const { workingDays, periodsPerDay } = school.schoolTimings;

    workingDays.forEach(day => {
      grid[day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        grid[day][p] = null;
      }
    });

    timetable.forEach(entry => {
      if (grid[entry.day] && grid[entry.day][entry.period] !== undefined) {
        grid[entry.day][entry.period] = {
          subject: entry.subject,
          teacherShortName: entry.teacherShortName,
          isLocked: entry.isLocked || false
        };
      }
    });

    return grid;
  };

  const activeClassObj = classes.find(c => c._id === selectedClassId);
  const grid = getGridData();
  const workingDays = school?.schoolTimings?.workingDays || [];
  const periodsPerDay = school?.schoolTimings?.periodsPerDay || 8;
  const lunchAfterPeriod = school?.schoolTimings?.lunchAfterPeriod || 4;

  // Toggle lock slot
  const handleToggleLock = async (day, period) => {
    if (!activeClassObj) return;

    try {
      const res = await api.post('/timetable/toggle-lock', {
        academicYear: activeAcademicYear,
        className: activeClassObj.className,
        section: activeClassObj.section,
        day,
        period
      });

      // Update local state
      setTimetable(prev => prev.map(item => 
        item.day === day && item.period === period 
          ? { ...item, isLocked: res.data.isLocked } 
          : item
      ));

      toast.success(`Slot ${res.data.isLocked ? 'locked' : 'unlocked'} successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error locking slot.');
    }
  };

  // Clear a slot
  const handleFreeSlot = async (day, period) => {
    if (!activeClassObj) return;
    if (!window.confirm(`Clear period ${period} on ${day}?`)) return;

    try {
      await api.post('/timetable/update-slot', {
        academicYear: activeAcademicYear,
        className: activeClassObj.className,
        section: activeClassObj.section,
        day,
        period,
        subject: null,
        teacherShortName: null
      });

      setTimetable(prev => prev.filter(item => !(item.day === day && item.period === period)));
      toast.success('Slot cleared successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear slot.');
    }
  };

  // Edit Dialog Controls
  const handleOpenEdit = (day, period, currentVal) => {
    // Check if the current value subject is in predefined subjects
    const isPredefined = subjects.some(s => s.subjectCode === currentVal?.subject);

    setEditSlot({ day, period });
    setEditForm({
      subject: currentVal?.subject || '',
      isCustomSubject: currentVal?.subject ? !isPredefined : false,
      customSubjectName: currentVal?.subject && !isPredefined ? currentVal.subject : '',
      teacherShortName: currentVal?.teacherShortName || '',
      isLocked: currentVal?.isLocked || false
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!activeClassObj || !editSlot) return;

    const finalSubject = editForm.isCustomSubject ? editForm.customSubjectName.trim() : editForm.subject;

    if (editForm.isCustomSubject && !finalSubject) {
      toast.error('Please enter a custom activity or subject name.');
      return;
    }

    if (finalSubject && !editForm.teacherShortName) {
      toast.error('Please assign a supervising teacher.');
      return;
    }

    try {
      await api.post('/timetable/update-slot', {
        academicYear: activeAcademicYear,
        className: activeClassObj.className,
        section: activeClassObj.section,
        day: editSlot.day,
        period: editSlot.period,
        subject: finalSubject || null,
        teacherShortName: editForm.teacherShortName || null,
        isLocked: editForm.isLocked
      });

      // Update state
      setTimetable(prev => {
        const exists = prev.some(item => item.day === editSlot.day && item.period === editSlot.period);
        const isSlotDeleted = !finalSubject || !editForm.teacherShortName;

        if (isSlotDeleted) {
          return prev.filter(item => !(item.day === editSlot.day && item.period === editSlot.period));
        }

        if (exists) {
          return prev.map(item =>
            item.day === editSlot.day && item.period === editSlot.period
              ? { ...item, subject: finalSubject, teacherShortName: editForm.teacherShortName, isLocked: editForm.isLocked }
              : item
          );
        } else {
          return [...prev, {
            className: activeClassObj.className,
            section: activeClassObj.section,
            day: editSlot.day,
            period: editSlot.period,
            subject: finalSubject,
            teacherShortName: editForm.teacherShortName,
            isLocked: editForm.isLocked
          }];
        }
      });

      setEditDialogOpen(false);
      toast.success('Slot updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conflict: Failed to update slot.');
    }
  };

  // HTML5 DRAG & DROP IMPLEMENTATION
  const handleDragStart = (e, day, period) => {
    setDraggedCell({ day, period });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetDay, targetPeriod) => {
    e.preventDefault();
    if (!draggedCell || !activeClassObj) return;

    const sourceDay = draggedCell.day;
    const sourcePeriod = draggedCell.period;

    // Check if dropping on the exact same slot
    if (sourceDay === targetDay && sourcePeriod === targetPeriod) {
      setDraggedCell(null);
      return;
    }

    const sourceData = grid[sourceDay]?.[sourcePeriod];
    const targetData = grid[targetDay]?.[targetPeriod];

    // Cannot swap if locked
    if (sourceData?.isLocked || targetData?.isLocked) {
      toast.warning('Cannot swap locked period slots.');
      setDraggedCell(null);
      return;
    }

    try {
      // Swapping: Send source cell to target, target cell to source
      // First update target slot with source data
      await api.post('/timetable/update-slot', {
        academicYear: activeAcademicYear,
        className: activeClassObj.className,
        section: activeClassObj.section,
        day: targetDay,
        period: targetPeriod,
        subject: sourceData?.subject || null,
        teacherShortName: sourceData?.teacherShortName || null
      });

      // Second update source slot with target data
      await api.post('/timetable/update-slot', {
        academicYear: activeAcademicYear,
        className: activeClassObj.className,
        section: activeClassObj.section,
        day: sourceDay,
        period: sourcePeriod,
        subject: targetData?.subject || null,
        teacherShortName: targetData?.teacherShortName || null
      });

      // Refresh timetable on success
      fetchTimetable();
      toast.success('Slots swapped successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conflict: Failed to swap slots.');
    } finally {
      setDraggedCell(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Timetable Generator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate weekly timetables automatically with a single click, or manually edit them using Drag and Drop.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <GenerateIcon />}
          onClick={handleGenerate}
          disabled={generating}
          sx={{
            bgcolor: '#0d47a1',
            py: 1.5,
            px: 4,
            borderRadius: 2.5,
            boxShadow: '0 4px 12px rgba(13, 71, 161, 0.3)',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#1565c0' }
          }}
        >
          {generating ? 'Generating...' : 'Generate Timetable'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="class-select-view-label">Select Class Section</InputLabel>
              <Select
                labelId="class-select-view-label"
                value={selectedClassId}
                label="Select Class Section"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.className} - Section {c.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            {school && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { md: 'flex-end' } }}>
                <Paper variant="outlined" sx={{ px: 2, py: 0.8, borderRadius: 1.5, bgcolor: '#fbfbfb', fontSize: '0.85rem' }}>
                  Assembly: <strong>{school.schoolTimings.assemblyStart} - {school.schoolTimings.assemblyEnd}</strong>
                </Paper>
                <Paper variant="outlined" sx={{ px: 2, py: 0.8, borderRadius: 1.5, bgcolor: '#fbfbfb', fontSize: '0.85rem' }}>
                  Period Duration: <strong>{school.schoolTimings.periodDuration} Mins</strong>
                </Paper>
                <Paper variant="outlined" sx={{ px: 2, py: 0.8, borderRadius: 1.5, bgcolor: '#fbfbfb', fontSize: '0.85rem' }}>
                  Total Periods: <strong>{periodsPerDay} Daily</strong>
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : timetable.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" color="text.secondary">
              No Timetable Data Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Please configure allocations and click the <strong>Generate Timetable</strong> button above.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', width: '120px' }}>Day</th>
                  {Array.from({ length: periodsPerDay }, (_, index) => {
                    const pNum = index + 1;
                    const items = [];
                    items.push(
                      <th key={`p-${pNum}`} style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                        Period {pNum}
                      </th>
                    );
                    if (pNum === lunchAfterPeriod) {
                      items.push(
                        <th key="lunch-head" style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#1565c0', backgroundColor: '#e3f2fd', width: '100px' }}>
                          LUNCH
                        </th>
                      );
                    }
                    return items;
                  })}
                </tr>
              </thead>
              <tbody>
                {workingDays.map((day) => (
                  <tr key={day} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold', backgroundColor: '#fafafa' }}>{day}</td>
                    {Array.from({ length: periodsPerDay }, (_, index) => {
                      const pNum = index + 1;
                      const cellData = grid[day]?.[pNum];
                      const items = [];

                      items.push(
                        <td
                          key={`c-${day}-${pNum}`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, pNum)}
                          style={{
                            padding: '8px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            height: '90px',
                            width: `${100 / (periodsPerDay + 1)}%`
                          }}
                        >
                          <Paper
                            draggable={cellData && !cellData.isLocked ? 'true' : 'false'}
                            onDragStart={(e) => handleDragStart(e, day, pNum)}
                            elevation={cellData ? 1 : 0}
                            sx={{
                              p: 1,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: 2,
                              border: cellData ? '1px solid rgba(21, 101, 192, 0.15)' : '1px dashed rgba(0,0,0,0.08)',
                              bgcolor: cellData?.isLocked
                                ? '#f3e5f5' // Locked color
                                : cellData
                                ? '#e3f2fd' // Allocated color
                                : 'transparent',
                              cursor: cellData && !cellData.isLocked ? 'grab' : 'default',
                              position: 'relative',
                              '&:hover .action-buttons': { opacity: 1 }
                            }}
                          >
                            {cellData ? (
                              <>
                                {/* Drag Icon handle */}
                                {!cellData.isLocked && (
                                  <DragIcon
                                    sx={{
                                      fontSize: 14,
                                      color: 'rgba(0,0,0,0.2)',
                                      position: 'absolute',
                                      left: 4,
                                      top: 4
                                    }}
                                  />
                                )}
                                
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: cellData.isLocked ? '#4a148c' : '#0d47a1', fontSize: '0.85rem' }}>
                                  {cellData.subject}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.2 }}>
                                  {cellData.teacherShortName}
                                </Typography>

                                {/* Mini Action Overlay */}
                                <Box
                                  className="action-buttons"
                                  sx={{
                                    position: 'absolute',
                                    right: 4,
                                    top: 4,
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    borderRadius: 1
                                  }}
                                >
                                  <Tooltip title={cellData.isLocked ? 'Unlock Period' : 'Lock Period'}>
                                    <IconButton size="small" onClick={() => handleToggleLock(day, pNum)}>
                                      {cellData.isLocked ? <LockIcon fontSize="inherit" color="secondary" /> : <LockOpenIcon fontSize="inherit" />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Quick Edit">
                                    <IconButton size="small" onClick={() => handleOpenEdit(day, pNum, cellData)}>
                                      <EditIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Clear Cell">
                                    <IconButton size="small" color="error" onClick={() => handleFreeSlot(day, pNum)}>
                                      <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Typography variant="caption" color="text.secondary">Free</Typography>
                                <Box
                                  className="action-buttons"
                                  sx={{
                                    position: 'absolute',
                                    right: 4,
                                    top: 4,
                                    opacity: 0,
                                    transition: 'opacity 0.2s'
                                  }}
                                >
                                  <Tooltip title="Assign Period">
                                    <IconButton size="small" onClick={() => handleOpenEdit(day, pNum, null)}>
                                      <AddIcon fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </td>
                      );

                      if (pNum === lunchAfterPeriod) {
                        items.push(
                          <td
                            key={`lunch-${day}`}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              backgroundColor: '#f1f8fe',
                              color: '#1565c0',
                              fontWeight: 'bold',
                              fontSize: '0.78rem',
                              borderLeft: '1px solid rgba(21,101,192,0.1)',
                              borderRight: '1px solid rgba(21,101,192,0.1)'
                            }}
                          >
                            LUNCH
                          </td>
                        );
                      }

                      return items;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>

      {/* Edit slot dialogue */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Assign Period: {editSlot?.day} - Period {editSlot?.period}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="edit-sub-label">Select Subject</InputLabel>
                <Select
                  labelId="edit-sub-label"
                  value={editForm.isCustomSubject ? 'CUSTOM' : editForm.subject}
                  label="Select Subject"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      setEditForm(prev => ({
                        ...prev,
                        isCustomSubject: true,
                        subject: '',
                        teacherShortName: ''
                      }));
                    } else {
                      // Predefined or none
                      const alloc = allocations.find(
                        a => a.subjectId?.subjectCode === val &&
                             a.classes.some(c => c._id === selectedClassId)
                      );
                      setEditForm(prev => ({
                        ...prev,
                        isCustomSubject: false,
                        subject: val,
                        customSubjectName: '',
                        teacherShortName: alloc?.teacherId?.shortName || ''
                      }));
                    }
                  }}
                >
                  <MenuItem value=""><em>None (Free Period)</em></MenuItem>
                  {subjects.map(s => (
                    <MenuItem key={s._id} value={s.subjectCode}>{s.subjectName} ({s.subjectCode})</MenuItem>
                  ))}
                  <MenuItem value="CUSTOM" sx={{ color: '#0d47a1', fontWeight: 'bold' }}>
                    + Custom Activity / Manual Subject
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {editForm.isCustomSubject && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Enter Subject / Activity Name"
                  placeholder="e.g. Library, Study Hour, Club"
                  value={editForm.customSubjectName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customSubjectName: e.target.value }))}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="edit-teach-label">Select Teacher</InputLabel>
                <Select
                  labelId="edit-teach-label"
                  value={editForm.teacherShortName}
                  label="Select Teacher"
                  onChange={(e) => setEditForm(prev => ({ ...prev, teacherShortName: e.target.value }))}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {teachers.map(t => (
                    <MenuItem key={t._id} value={t.shortName}>{t.fullName} ({t.shortName})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateTimetable;
