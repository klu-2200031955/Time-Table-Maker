import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  BorderAll as ExcelIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TeacherTimetable = () => {
  const { school, activeAcademicYear } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherShort, setSelectedTeacherShort] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  const workingDays = school?.schoolTimings?.workingDays || [];
  const periodsPerDay = school?.schoolTimings?.periodsPerDay || 8;
  const lunchAfterPeriod = school?.schoolTimings?.lunchAfterPeriod || 4;

  useEffect(() => {
    fetchTeachersAndTimetable();
  }, [activeAcademicYear]);

  const fetchTeachersAndTimetable = async () => {
    setLoading(true);
    try {
      const [tRes, ttRes] = await Promise.all([
        api.get('/teachers'),
        api.get(`/timetable?academicYear=${activeAcademicYear}`)
      ]);
      setTeachers(tRes.data);
      setTimetable(ttRes.data);
      if (tRes.data.length > 0) {
        setSelectedTeacherShort(tRes.data[0].shortName);
      }
    } catch (err) {
      console.error('Failed to load teacher timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get active teacher details
  const activeTeacher = teachers.find(t => t.shortName === selectedTeacherShort);

  // Filter timetable for this teacher
  const teacherEntries = timetable.filter(e => e.teacherShortName === selectedTeacherShort);

  // Build grid map
  const getGridData = () => {
    const grid = {};
    workingDays.forEach(day => {
      grid[day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        grid[day][p] = null;
      }
    });

    teacherEntries.forEach(entry => {
      if (grid[entry.day] && grid[entry.day][entry.period] !== undefined) {
        grid[entry.day][entry.period] = {
          subject: entry.subject,
          className: entry.className,
          section: entry.section
        };
      }
    });
    return grid;
  };

  const grid = getGridData();

  // Export PDF
  const handleExportPDF = () => {
    if (!activeTeacher) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`${school?.schoolName || 'School'} - Teacher Timetable`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Teacher: ${activeTeacher.fullName} (${activeTeacher.shortName}) | Dept: ${activeTeacher.subject} | Year: ${activeAcademicYear}`, 14, 22);

    const headers = [['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `P${i+1}`)]];
    headers[0].splice(lunchAfterPeriod + 1, 0, 'LUNCH');

    const body = [];
    workingDays.forEach(day => {
      const row = [day];
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = grid[day][p];
        row.push(slot ? `${slot.className}-${slot.section}\n[${slot.subject}]` : '-');
        if (p === lunchAfterPeriod) {
          row.push('LUNCH');
        }
      }
      body.push(row);
    });

    doc.autoTable({
      head: headers,
      body: body,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] }, // Green theme for teachers
      styles: { fontSize: 9, halign: 'center', valign: 'middle' }
    });

    doc.save(`Timetable_Teacher_${selectedTeacherShort}_${activeAcademicYear}.pdf`);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeTeacher) return;
    
    const headers = ['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `Period ${i+1}`)];
    headers.splice(lunchAfterPeriod + 1, 0, 'LUNCH');

    const rows = [
      [`Teacher: ${activeTeacher.fullName} (${activeTeacher.shortName})`, `Department: ${activeTeacher.subject}`, `Academic Year: ${activeAcademicYear}`],
      [],
      headers
    ];

    workingDays.forEach(day => {
      const row = [day];
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = grid[day][p];
        row.push(slot ? `${slot.className}-${slot.section} (${slot.subject})` : 'Free');
        if (p === lunchAfterPeriod) {
          row.push('LUNCH');
        }
      }
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teacher Timetable');
    XLSX.writeFile(wb, `Timetable_Teacher_${selectedTeacherShort}_${activeAcademicYear}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ '@media print': { '& .filter-box': { display: 'none' } } }}>
      <Box className="filter-box" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Teacher Timetable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a faculty member to view, print, or download their personal schedule.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" color="error" startIcon={<PdfIcon />} onClick={handleExportPDF}>PDF</Button>
          <Button variant="outlined" color="success" startIcon={<ExcelIcon />} onClick={handleExportExcel}>Excel</Button>
        </Box>
      </Box>

      {/* Filter Selector */}
      <Paper className="filter-box" sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="teacher-view-select-label">Select Teacher</InputLabel>
              <Select
                labelId="teacher-view-select-label"
                value={selectedTeacherShort}
                label="Select Teacher"
                onChange={(e) => setSelectedTeacherShort(e.target.value)}
              >
                {teachers.map(t => (
                  <MenuItem key={t._id} value={t.shortName}>
                    {t.fullName} ({t.shortName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {activeTeacher && (
            <Grid item xs={12} sm={6} md={8}>
              <Typography variant="body2" color="text.secondary">
                Department Specialist: <strong>{activeTeacher.subject}</strong> | Mobile: <strong>{activeTeacher.mobile || 'N/A'}</strong>
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !selectedTeacherShort ? (
        <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">No teachers found. Please add teachers in setup or faculty pages.</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>
            Timetable: {activeTeacher?.fullName} ({selectedTeacherShort})
          </Typography>
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
                    const slot = grid[day]?.[pNum];
                    const items = [];

                    items.push(
                      <td
                        key={`c-${day}-${pNum}`}
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          height: '80px',
                          width: `${100 / (periodsPerDay + 1)}%`
                        }}
                      >
                        {slot ? (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: 2,
                              border: '1px solid rgba(46, 125, 50, 0.15)',
                              bgcolor: '#e8f5e9' // green highlight for teacher free of conflicts
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '0.85rem' }}>
                              {slot.className}-{slot.section}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.2 }}>
                              {slot.subject}
                            </Typography>
                          </Paper>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Free</Typography>
                        )}
                      </td>
                    );

                    if (pNum === lunchAfterPeriod) {
                      items.push(
                        <td
                          key={`lunch-${day}`}
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            backgroundColor: '#f1f8fe',
                            color: '#1565c0',
                            fontWeight: 'bold',
                            fontSize: '0.78rem'
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
        </Paper>
      )}
    </Box>
  );
};

export default TeacherTimetable;
