import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Book as BookIcon,
  Class as ClassIcon
} from '@mui/icons-material';

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, cRes, aRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/allocations')
      ]);

      setTeachers(tRes.data);
      setSubjects(sRes.data);
      setClasses(cRes.data);
      setAllocations(aRes.data);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 1. Calculate Teacher Workloads
  const getTeacherWorkloads = () => {
    return teachers.map(teacher => {
      // Find all allocations for this teacher
      const teacherAllocs = allocations.filter(a => a.teacherId?._id === teacher._id);
      
      let totalWeeklyPeriods = 0;
      const assignedClasses = [];

      teacherAllocs.forEach(a => {
        if (a.subjectId) {
          totalWeeklyPeriods += a.subjectId.weeklyPeriods * a.classes.length;
          a.classes.forEach(c => {
            const display = `${c.className}-${c.section}`;
            if (!assignedClasses.includes(display)) {
              assignedClasses.push(display);
            }
          });
        }
      });

      return {
        ...teacher,
        totalWeeklyPeriods,
        assignedClasses
      };
    });
  };

  // 2. Class-wise allocation report
  const getClassReport = () => {
    return classes.map(cls => {
      // Find all allocations that include this class
      const classAllocs = allocations.filter(
        a => a.classes.some(c => c._id === cls._id)
      );

      const subjectsList = classAllocs.map(a => a.subjectId ? `${a.subjectId.subjectName} (${a.subjectId.subjectCode})` : 'Unknown');
      const teachersList = classAllocs.map(a => a.teacherId ? `${a.teacherId.fullName} (${a.teacherId.shortName})` : 'Unknown');

      return {
        ...cls,
        subjectsList,
        teachersList
      };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const workloads = getTeacherWorkloads();
  const classReport = getClassReport();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Academic Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze workload distributions, subject mapping efficiency, and class alignments.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Teacher Workload Report" sx={{ fontWeight: 600 }} />
            <Tab icon={<BookIcon />} iconPosition="start" label="Subject Allocation Report" sx={{ fontWeight: 600 }} />
            <Tab icon={<ClassIcon />} iconPosition="start" label="Class Report" sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* Tab 0: Teacher Workload */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Teacher Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Short Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Weekly Periods</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assigned Classes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workloads.map((tw) => (
                    <TableRow key={tw._id}>
                      <TableCell sx={{ fontWeight: 500 }}>{tw.fullName}</TableCell>
                      <TableCell>{tw.shortName}</TableCell>
                      <TableCell>{tw.subject}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: tw.totalWeeklyPeriods > 36 ? 'error.main' : 'text.primary' }}>
                        {tw.totalWeeklyPeriods}
                      </TableCell>
                      <TableCell>
                        {tw.assignedClasses.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tw.assignedClasses.map(cls => (
                              <Chip key={cls} label={cls} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Subject Allocations */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Teacher</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Weekly Periods</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assigned Classes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {a.subjectId ? `${a.subjectId.subjectName} (${a.subjectId.subjectCode})` : '-'}
                      </TableCell>
                      <TableCell>
                        {a.teacherId ? `${a.teacherId.fullName} (${a.teacherId.shortName})` : '-'}
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
                              color="primary"
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Class Report */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Class Grade</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Allocated Subjects</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Teaching Faculty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classReport.map((cr) => (
                    <TableRow key={cr._id}>
                      <TableCell sx={{ fontWeight: 500 }}>{cr.className}</TableCell>
                      <TableCell>{cr.section}</TableCell>
                      <TableCell>
                        {cr.subjectsList.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {cr.subjectsList.map((sub, idx) => (
                              <Chip key={idx} label={sub} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {cr.teachersList.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {cr.teachersList.map((t, idx) => (
                              <Chip key={idx} label={t} size="small" variant="outlined" color="secondary" />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
