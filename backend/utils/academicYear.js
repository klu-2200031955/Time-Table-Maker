/**
 * Calculates academic year based on rules:
 * - Academic Year starts in June (month index 5).
 * - Academic Year ends in April of the following year.
 * - Months Jan-May are in the academic year that started in the previous calendar year.
 * - Months Jun-Dec start a new academic year.
 * 
 * Example:
 * - June 2026 -> 2026-27
 * - Jan 2027 -> 2026-27
 * - June 2027 -> 2027-28
 * 
 * @param {Date} [date] - Date to calculate for, defaults to current date.
 * @returns {string} - Academic year string (e.g. "2026-27")
 */
const getAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 is January, 11 is December
  
  let startYear, endYear;
  if (month >= 5) { // June (5) to December (11)
    startYear = year;
    endYear = year + 1;
  } else { // January (0) to May (4)
    startYear = year - 1;
    endYear = year;
  }
  
  const shortEndYear = String(endYear).slice(-2);
  return `${startYear}-${shortEndYear}`;
};

module.exports = { getAcademicYear };
