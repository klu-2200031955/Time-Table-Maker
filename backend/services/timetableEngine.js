const Timetable = require('../models/Timetable');

/**
 * Shuffles an array in place (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Timetable Solver Engine
 */
const generateTimetableData = async (school, academicYear, teachers, subjects, classes, allocations) => {
  const { workingDays, periodsPerDay } = school.schoolTimings;

  // 1. Fetch existing locked periods from the database for this academic year
  const lockedEntries = await Timetable.find({
    schoolId: school._id,
    academicYear,
    isLocked: true
  });

  // 2. Initialize the grids
  // grid[classKey][day][period] = lesson
  // teacherGrid[teacherShortName][day][period] = lesson
  const grid = {};
  const teacherGrid = {};

  // Setup keys for classes and teachers
  classes.forEach(c => {
    const classKey = `${c.className}-${c.section}`;
    grid[classKey] = {};
    workingDays.forEach(day => {
      grid[classKey][day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        grid[classKey][day][p] = null;
      }
    });
  });

  teachers.forEach(t => {
    teacherGrid[t.shortName] = {};
    workingDays.forEach(day => {
      teacherGrid[t.shortName][day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        teacherGrid[t.shortName][day][p] = null;
      }
    });
  });

  // 3. Pre-fill locked periods into grids
  const lockedSet = new Set();
  lockedEntries.forEach(entry => {
    const classKey = `${entry.className}-${entry.section}`;
    const lesson = {
      className: entry.className,
      section: entry.section,
      subject: entry.subject,
      teacherShortName: entry.teacherShortName,
      isLocked: true,
      fromLocked: true // flag indicating it was pre-locked
    };

    if (grid[classKey] && grid[classKey][entry.day]) {
      grid[classKey][entry.day][entry.period] = lesson;
    }
    if (teacherGrid[entry.teacherShortName] && teacherGrid[entry.teacherShortName][entry.day]) {
      teacherGrid[entry.teacherShortName][entry.day][entry.period] = lesson;
    }

    // Keep track of how many periods of this subject are already scheduled due to locks
    const lockKey = `${classKey}-${entry.subject}`;
    lockedSet.add(`${classKey}-${entry.day}-${entry.period}`);
  });

  // 4. Compile the list of lessons that NEED to be scheduled
  const lessonsToSchedule = [];
  const teacherWorkloads = {}; // To calculate constraints

  // Calculate teacher workloads from allocations to sort lessons by constraint difficulty
  allocations.forEach(alloc => {
    const teacher = alloc.teacherId;
    const subject = alloc.subjectId;
    if (!teacher || !subject) return;

    const teacherKey = teacher.shortName;
    const totalPeriods = subject.weeklyPeriods * alloc.classes.length;
    teacherWorkloads[teacherKey] = (teacherWorkloads[teacherKey] || 0) + totalPeriods;
  });

  // For each allocation, find how many periods we need to schedule for each class section
  allocations.forEach(alloc => {
    const teacher = alloc.teacherId;
    const subject = alloc.subjectId;
    if (!teacher || !subject) return;

    alloc.classes.forEach(classObj => {
      const classKey = `${classObj.className}-${classObj.section}`;
      
      // Calculate how many periods of this subject are already locked for this class
      const periodsAlreadyLocked = lockedEntries.filter(
        le => le.className === classObj.className &&
              le.section === classObj.section &&
              le.subject === subject.subjectCode
      ).length;

      const periodsNeeded = subject.weeklyPeriods - periodsAlreadyLocked;

      for (let i = 0; i < periodsNeeded; i++) {
        lessonsToSchedule.push({
          classKey,
          className: classObj.className,
          section: classObj.section,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          teacherShortName: teacher.shortName,
          weeklyPeriods: subject.weeklyPeriods
        });
      }
    });
  });

  // Sort lessons: prioritize teachers with higher workloads (most constrained variables)
  lessonsToSchedule.sort((a, b) => {
    const wlA = teacherWorkloads[a.teacherShortName] || 0;
    const wlB = teacherWorkloads[b.teacherShortName] || 0;
    return wlB - wlA;
  });

  // Helper to count how many times a subject is scheduled in a day for a class
  const countSubjectOnDay = (classKey, day, subjectCode) => {
    let count = 0;
    for (let p = 1; p <= periodsPerDay; p++) {
      if (grid[classKey][day][p] && grid[classKey][day][p].subject === subjectCode) {
        count++;
      }
    }
    return count;
  };

  // Backtracking solver
  let stepCount = 0;
  const MAX_STEPS = 50000;

  const solve = (index, useStrictSubjectLimit = true) => {
    stepCount++;
    if (stepCount > MAX_STEPS) return false; // Avoid hanging
    if (index >= lessonsToSchedule.length) return true; // Solved!

    const lesson = lessonsToSchedule[index];
    const { classKey, subjectCode, teacherShortName, weeklyPeriods } = lesson;

    // Find all valid slots
    const validSlots = [];
    for (const day of workingDays) {
      for (let p = 1; p <= periodsPerDay; p++) {
        // Class slot must be free
        if (grid[classKey][day][p] !== null) continue;
        // Teacher must be free
        if (teacherGrid[teacherShortName] && teacherGrid[teacherShortName][day][p] !== null) continue;

        // Subject per day limit (avoid styling all maths classes on one day)
        if (useStrictSubjectLimit) {
          const maxPerDay = Math.ceil(weeklyPeriods / workingDays.length);
          const countToday = countSubjectOnDay(classKey, day, subjectCode);
          if (countToday >= maxPerDay) continue;
        }

        validSlots.push({ day, period: p });
      }
    }

    // Shuffle slots slightly to avoid identical layout patterns
    shuffleArray(validSlots);

    for (const slot of validSlots) {
      // Place lesson
      const scheduledLesson = {
        className: lesson.className,
        section: lesson.section,
        subject: subjectCode,
        teacherShortName,
        isLocked: false
      };

      grid[classKey][slot.day][slot.period] = scheduledLesson;
      if (teacherGrid[teacherShortName]) {
        teacherGrid[teacherShortName][slot.day][slot.period] = scheduledLesson;
      }

      // Recurse
      if (solve(index + 1, useStrictSubjectLimit)) return true;

      // Backtrack
      grid[classKey][slot.day][slot.period] = null;
      if (teacherGrid[teacherShortName]) {
        teacherGrid[teacherShortName][slot.day][slot.period] = null;
      }
    }

    return false;
  };

  // Run solver
  stepCount = 0;
  // First try: Strict subject-per-day constraints
  let success = solve(0, true);
  
  if (!success) {
    console.log("Strict constraints solver failed or timed out. Retrying with relaxed constraints...");
    // Clear dynamic allocations from grid before retry
    classes.forEach(c => {
      const classKey = `${c.className}-${c.section}`;
      workingDays.forEach(day => {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[classKey][day][p] && !grid[classKey][day][p].fromLocked) {
            grid[classKey][day][p] = null;
          }
        }
      });
    });
    teachers.forEach(t => {
      workingDays.forEach(day => {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (teacherGrid[t.shortName][day][p] && !teacherGrid[t.shortName][day][p].fromLocked) {
            teacherGrid[t.shortName][day][p] = null;
          }
        }
      });
    });

    stepCount = 0;
    // Second try: Relaxed subject-per-day constraints
    success = solve(0, false);
  }

  if (!success) {
    throw new Error("Unable to generate conflict-free timetable. The teacher allocation constraints might be too tight. Please try adjusting subject allocations or adding more teachers.");
  }

  // 5. Flatten the grid into Timetable database documents format
  const timetableRecords = [];
  classes.forEach(c => {
    const classKey = `${c.className}-${c.section}`;
    workingDays.forEach(day => {
      for (let p = 1; p <= periodsPerDay; p++) {
        const item = grid[classKey][day][p];
        if (item) {
          timetableRecords.push({
            schoolId: school._id,
            academicYear,
            className: c.className,
            section: c.section,
            day,
            period: p,
            subject: item.subject,
            teacherShortName: item.teacherShortName,
            isLocked: item.isLocked || false
          });
        }
      }
    });
  });

  return timetableRecords;
};

module.exports = { generateTimetableData };
