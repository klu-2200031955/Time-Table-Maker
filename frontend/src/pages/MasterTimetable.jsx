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
  Divider,
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

const MasterTimetable = () => {
  const { school, activeAcademicYear } = useAuth();
  const [classes, setClasses] = useState([]);
  const [timetable, setTimetable] = useState([]);
  
  // Filter States
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');
  const [loading, setLoading] = useState(false);

  const workingDays = school?.schoolTimings?.workingDays || [];
  const periodsPerDay = school?.schoolTimings?.periodsPerDay || 8;
  const lunchAfterPeriod = school?.schoolTimings?.lunchAfterPeriod || 4;

  useEffect(() => {
    fetchMetadataAndTimetable();
  }, [activeAcademicYear]);

  const fetchMetadataAndTimetable = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/classes'),
        api.get(`/timetable?academicYear=${activeAcademicYear}`)
      ]);
      setClasses(cRes.data);
      setTimetable(tRes.data);
    } catch (err) {
      console.error('Failed to load master timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get list of distinct class names (e.g. Class 1, Class 6)
  const distinctClassNames = ['All', ...new Set(classes.map(c => c.className))];
  
  // Get list of distinct sections
  const distinctSections = ['All', ...new Set(classes.map(c => c.section))];

  // Filtered timetable records
  const getFilteredEntries = () => {
    return timetable.filter(entry => {
      const matchesClass = selectedClass === 'All' || entry.className === selectedClass;
      const matchesSection = selectedSection === 'All' || entry.section === selectedSection;
      const matchesDay = selectedDay === 'All' || entry.day === selectedDay;
      return matchesClass && matchesSection && matchesDay;
    });
  };

  const filteredEntries = getFilteredEntries();

  // Distinct classes showing in results
  const filteredClassesList = classes.filter(cls => {
    const matchesClass = selectedClass === 'All' || cls.className === selectedClass;
    const matchesSection = selectedSection === 'All' || cls.section === selectedSection;
    return matchesClass && matchesSection;
  });

  // Export to Excel handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (selectedDay !== 'All') {
      // Day Pivot View: Class rows, Period columns
      const headers = ['Class Section', ...Array.from({ length: periodsPerDay }, (_, i) => `Period ${i+1}`)];
      // Insert LUNCH into headers
      headers.splice(lunchAfterPeriod + 1, 0, 'LUNCH');

      const rows = [headers];
      filteredClassesList.forEach(cls => {
        const row = [`${cls.className}-${cls.section}`];
        for (let p = 1; p <= periodsPerDay; p++) {
          const slot = filteredEntries.find(
            e => e.className === cls.className && e.section === cls.section && e.day === selectedDay && e.period === p
          );
          row.push(slot ? `${slot.subject} (${slot.teacherShortName})` : 'Free');
          if (p === lunchAfterPeriod) {
            row.push('LUNCH');
          }
        }
        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, selectedDay);
    } else {
      // Loop through all classes and create a sheet for each
      filteredClassesList.forEach(cls => {
        const headers = ['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `Period ${i+1}`)];
        headers.splice(lunchAfterPeriod + 1, 0, 'LUNCH');

        const rows = [headers];
        workingDays.forEach(day => {
          const row = [day];
          for (let p = 1; p <= periodsPerDay; p++) {
            const slot = filteredEntries.find(
              e => e.className === cls.className && e.section === cls.section && e.day === day && e.period === p
            );
            row.push(slot ? `${slot.subject} (${slot.teacherShortName})` : 'Free');
            if (p === lunchAfterPeriod) {
              row.push('LUNCH');
            }
          }
          rows.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, `${cls.className}-${cls.section}`);
      });
    }

    XLSX.writeFile(wb, `Master_Timetable_${activeAcademicYear}.xlsx`);
  };

  // Export to PDF handler
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `${school?.schoolName || 'School'} - Master Timetable (${activeAcademicYear})`;
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(11);
    doc.text(`Filter: Class: ${selectedClass}, Section: ${selectedSection}, Day: ${selectedDay}`, 14, 22);

    let startY = 28;

    if (selectedDay !== 'All') {
      // Single Day Pivot View
      const headers = [['Class Section', ...Array.from({ length: periodsPerDay }, (_, i) => `P${i+1}`)]];
      headers[0].splice(lunchAfterPeriod + 1, 0, 'LUNCH');

      const body = [];
      filteredClassesList.forEach(cls => {
        const row = [`${cls.className}-${cls.section}`];
        for (let p = 1; p <= periodsPerDay; p++) {
          const slot = filteredEntries.find(
            e => e.className === cls.className && e.section === cls.section && e.day === selectedDay && e.period === p
          );
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
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: [26, 35, 126] },
        styles: { fontSize: 8, halign: 'center', valign: 'middle' }
      });
    } else {
      // Loop classes and generate table for each
      filteredClassesList.forEach((cls, idx) => {
        if (idx > 0) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(13);
        doc.text(`Class: ${cls.className}-${cls.section}`, 14, startY - 5);

        const headers = [['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `P${i+1}`)]];
        headers[0].splice(lunchAfterPeriod + 1, 0, 'LUNCH');

        const body = [];
        workingDays.forEach(day => {
          const row = [day];
          for (let p = 1; p <= periodsPerDay; p++) {
            const slot = filteredEntries.find(
              e => e.className === cls.className && e.section === cls.section && e.day === day && e.period === p
            );
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
          startY: startY,
          theme: 'grid',
          headStyles: { fillColor: [26, 35, 126] },
          styles: { fontSize: 8, halign: 'center', valign: 'middle' }
        });

        startY = doc.lastAutoTable.finalY + 15;
      });
    }

    doc.save(`Master_Timetable_${activeAcademicYear}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ '@media print': { '& .filter-box': { display: 'none' } } }}>
      <Box className="filter-box" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Master Timetable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View, print, or download the full timetable across all classes.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" color="error" startIcon={<PdfIcon />} onClick={handleExportPDF}>PDF</Button>
          <Button variant="outlined" color="success" startIcon={<ExcelIcon />} onClick={handleExportExcel}>Excel</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper className="filter-box" sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                {distinctClassNames.map(name => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select value={selectedSection} label="Section" onChange={(e) => setSelectedSection(e.target.value)}>
                {distinctSections.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Day</InputLabel>
              <Select value={selectedDay} label="Day" onChange={(e) => setSelectedDay(e.target.value)}>
                <MenuItem value="All">All Days</MenuItem>
                {workingDays.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
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
      ) : timetable.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">No timetable records found. Please generate the timetable.</Typography>
        </Box>
      ) : selectedDay !== 'All' ? (
        /* Day Pivot Grid View */
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>
            Master Grid for {selectedDay}
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Class</th>
                {Array.from({ length: periodsPerDay }, (_, idx) => {
                  const p = idx + 1;
                  const items = [<th key={p} style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Period {p}</th>];
                  if (p === lunchAfterPeriod) {
                    items.push(<th key="lunch-head" style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#1565c0', backgroundColor: '#e3f2fd' }}>LUNCH</th>);
                  }
                  return items;
                })}
              </tr>
            </thead>
            <tbody>
              {filteredClassesList.map(cls => (
                <tr key={`${cls.className}-${cls.section}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#fafafa' }}>{cls.className}-{cls.section}</td>
                  {Array.from({ length: periodsPerDay }, (_, idx) => {
                    const p = idx + 1;
                    const slot = filteredEntries.find(
                      e => e.className === cls.className && e.section === cls.section && e.day === selectedDay && e.period === p
                    );
                    const items = [
                      <td key={p} style={{ padding: '12px', textAlign: 'center' }}>
                        {slot ? (
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d47a1', fontSize: '0.82rem' }}>{slot.subject}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{slot.teacherShortName}</Typography>
                          </Box>
                        ) : '-'}
                      </td>
                    ];
                    if (p === lunchAfterPeriod) {
                      items.push(
                        <td key="lunch" style={{ padding: '12px', textAlign: 'center', backgroundColor: '#f1f8fe', color: '#1565c0', fontWeight: 'bold', fontSize: '0.75rem' }}>
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
      ) : (
        /* List of Class Grids View */
        filteredClassesList.map(cls => (
          <Paper key={`${cls.className}-${cls.section}`} sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', mb: 4, pageBreakAfter: 'always', overflowX: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Class {cls.className} - Section {cls.section}
            </Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', width: '120px' }}>Day</th>
                  {Array.from({ length: periodsPerDay }, (_, idx) => {
                    const p = idx + 1;
                    const items = [<th key={p} style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Period {p}</th>];
                    if (p === lunchAfterPeriod) {
                      items.push(<th key="lunch-head" style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#1565c0', backgroundColor: '#e3f2fd' }}>LUNCH</th>);
                    }
                    return items;
                  })}
                </tr>
              </thead>
              <tbody>
                {workingDays.map(day => (
                  <tr key={day} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#fafafa' }}>{day}</td>
                    {Array.from({ length: periodsPerDay }, (_, idx) => {
                      const p = idx + 1;
                      const slot = filteredEntries.find(
                        e => e.className === cls.className && e.section === cls.section && e.day === day && e.period === p
                      );
                      const items = [
                        <td key={p} style={{ padding: '12px', textAlign: 'center' }}>
                          {slot ? (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d47a1', fontSize: '0.82rem' }}>{slot.subject}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{slot.teacherShortName}</Typography>
                            </Box>
                          ) : '-'}
                        </td>
                      ];
                      if (p === lunchAfterPeriod) {
                        items.push(
                          <td key="lunch" style={{ padding: '12px', textAlign: 'center', backgroundColor: '#f1f8fe', color: '#1565c0', fontWeight: 'bold', fontSize: '0.75rem' }}>
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
        ))
      )}
    </Box>
  );
};

export default MasterTimetable;
