# Multi-School School Timetable Management System

A production-ready SaaS School Timetable Management System built using Node.js/Express, React (Vite/MUI), and MongoDB. This platform isolates data by school accounts, enables first-time configuration wizards, calculates academic years automatically, and features an automated conflict-free timetable generation engine alongside an interactive manual editor.

## Key Features

1. **School-Level Isolation**: Multi-school tenancy where data is completely secure and isolated by JWT authorization.
2. **Auto Academic Year**: Automatically calculates active academic year using June-April calendar rules (e.g. June 2026 -> 2026-27).
3. **Setup Wizard**: Seamless stepped onboarding to configure faculty rosters, subject weightage, class sections, and weekly periods.
4. **Timetable Generator**: Backtracking solver that schedules conflict-free periods (no teacher double-bookings, no class overlap, fixed assembly & lunch bounds).
5. **Interactive Grid Editor**: Drag-and-drop cell swaps, lock/unlock toggle, and manual assignments to customize generated timetables.
6. **Data Exports**: Download Master, Teacher-wise, and Class-wise timetables as Excel spreadsheets (using SheetJS) or PDFs (using jsPDF), or Print directly.

---

## Directory Structure

```
Time Table Maker/
├── backend/
│   ├── config/          # Mongoose database connection
│   ├── controllers/     # Controller logic for auth, teachers, timetables, etc.
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Mongoose collection schemas
│   ├── routes/          # Express router mounts
│   ├── services/        # Timetable backtracking engine solver
│   ├── utils/           # Academic Year calculation helper
│   ├── app.js           # Express app configuring middleware
│   └── server.js        # Server bootstrapping
└── frontend/
    ├── src/
    │   ├── context/     # Auth & Academic Year state provider
    │   ├── layouts/     # Responsive sidebar/navbar layouts
    │   ├── pages/       # Login, wizard steps, editors, reports, and timetables
    │   ├── services/    # Axios API client
    │   ├── App.jsx      # Theme definitions and routing
    │   └── main.jsx     # App mounting
    └── vite.config.js   # Vite bundle configurations
```

---

## Local Development Setup

### Prerequisites

* Node.js (v18 or higher recommended)
* MongoDB (Local server or MongoDB Atlas URL)

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`. A default template is provided:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/timetable-maker
   JWT_SECRET=super_secret_jwt_key_9999_for_timetable_maker
   NODE_ENV=development
   ```
4. Start the backend development server (runs with nodemon):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open another terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## Generating and Exporting Timetables

1. **Register**: Choose a school type (Primary School Class 1-5 or High School Class 6-10). Default class-sections (e.g. 6-A, 7-A...) are seeded automatically.
2. **Onboarding**: Fill in the Stepped wizard to add Teachers, configure Subjects (e.g. weekly periods), verify Class sections, and specify timings (working days, daily periods, duration, lunch offset, and assembly).
3. **Allocation**: Map teachers to subjects for specific sections (e.g., assign KSP to teach Maths for 8-A and 9-A).
4. **Generate**: Navigate to "Generate Timetable" and click **Generate Timetable**. The solver schedules slots instantly.
5. **Edit**: Drag and drop any class slot to swap them. Click on the lock icon to freeze key periods, and run generate again to solve around the locked cells.
6. **Download / Print**: Open Master, Teacher, or Class timetables. Click the **Excel** button to download the spreadsheet, **PDF** to download a print-layout document, or **Print** to send it directly to your hardware printer.
