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

const ClassTimetable = () => {
  const { school, activeAcademicYear } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  const workingDays = school?.schoolTimings?.workingDays || [];
  const periodsPerDay = school?.schoolTimings?.periodsPerDay || 8;
  const lunchAfterPeriod = school?.schoolTimings?.lunchAfterPeriod || 4;

  useEffect(() => {
    fetchClassesAndTimetable();
  }, [activeAcademicYear]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes]);

  const fetchClassesAndTimetable = async () => {
    setLoading(true);
    try {
      const [cRes, ttRes] = await Promise.all([
        api.get('/classes'),
        api.get(`/timetable?academicYear=${activeAcademicYear}`)
      ]);
      setClasses(cRes.data);
      setTimetable(ttRes.data);
    } catch (err) {
      console.error('Failed to load class timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeClass = classes.find(c => c._id === selectedClassId);

  // Filter entries for this class
  const classEntries = activeClass
    ? timetable.filter(e => e.className === activeClass.className && e.section === activeClass.section)
    : [];

  // Build grid map
  const getGridData = () => {
    const grid = {};
    workingDays.forEach(day => {
      grid[day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        grid[day][p] = null;
      }
    });

    classEntries.forEach(entry => {
      if (grid[entry.day] && grid[entry.day][entry.period] !== undefined) {
        grid[entry.day][entry.period] = {
          subject: entry.subject,
          teacherShortName: entry.teacherShortName
        };
      }
    });
    return grid;
  };

  const grid = getGridData();

  // Export PDF
  const handleExportPDF = () => {
    if (!activeClass) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`${school?.schoolName || 'School'} - Class Timetable`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Class: ${activeClass.className} - Section ${activeClass.section} | Year: ${activeAcademicYear}`, 14, 22);

    const headers = [['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `P${i+1}`)]];
    headers[0].splice(lunchAfterPeriod + 1, 0, 'LUNCH');

    const body = [];
    workingDays.forEach(day => {
      const row = [day];
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = grid[day][p];
        row.push(slot ? `${slot.subject}\n(${slot.teacherShortName})` : '-');
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
      headStyles: { fillColor: [26, 35, 126] },
      styles: { fontSize: 9, halign: 'center', valign: 'middle' }
    });

    doc.save(`Timetable_Class_${activeClass.className}_${activeClass.section}_${activeAcademicYear}.pdf`);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeClass) return;
    
    const headers = ['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `Period ${i+1}`)];
    headers.splice(lunchAfterPeriod + 1, 0, 'LUNCH');

    const rows = [
      [`Class: ${activeClass.className}-${activeClass.section}`, `Academic Year: ${activeAcademicYear}`],
      [],
      headers
    ];

    workingDays.forEach(day => {
      const row = [day];
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = grid[day][p];
        row.push(slot ? `${slot.subject} (${slot.teacherShortName})` : 'Free');
        if (p === lunchAfterPeriod) {
          row.push('LUNCH');
        }
      }
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Class Timetable');
    XLSX.writeFile(wb, `Timetable_Class_${activeClass.className}_${activeClass.section}_${activeAcademicYear}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ '@media print': { '& .filter-box': { display: 'none' } } }}>
      <Box className="filter-box" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Class Wise Timetable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a class and section to view, print, or download its weekly schedule.
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
              <InputLabel id="class-view-select-label">Select Class Section</InputLabel>
              <Select
                labelId="class-view-select-label"
                value={selectedClassId}
                label="Select Class Section"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map(c => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.className} - Section {c.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !selectedClassId ? (
        <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">No class sections configured. Please configure class structures first.</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>
            Timetable: {activeClass?.className} - {activeClass?.section}
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
                              border: '1px solid rgba(21, 101, 192, 0.15)',
                              bgcolor: '#e3f2fd'
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d47a1', fontSize: '0.85rem' }}>
                              {slot.subject}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.2 }}>
                              {slot.teacherShortName}
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

export default ClassTimetable;
