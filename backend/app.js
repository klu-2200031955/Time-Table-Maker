const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const schoolRoutes = require('./routes/schoolRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Uptime Monitoring (from Uptime KI patterns)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/uptime', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Express Server Uptime Status</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f7f9fc; color: #333; }
        .card { max-width: 500px; margin: auto; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .status { color: #2e7d32; font-weight: bold; font-size: 1.2rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Server Status</h1>
        <p class="status">● Running (UP)</p>
        <p>Uptime: <strong>${Math.floor(process.uptime())} seconds</strong></p>
        <p>Timestamp: <strong>${new Date().toLocaleTimeString()}</strong></p>
      </div>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/school', schoolRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred'
  });
});

module.exports = app;
