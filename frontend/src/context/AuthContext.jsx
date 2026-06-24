import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState('');

  // Auto-calculate default academic year matching utility logic
  const getDefaultAcademicYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    let startYear, endYear;
    if (month >= 5) {
      startYear = year;
      endYear = year + 1;
    } else {
      startYear = year - 1;
      endYear = year;
    }
    return `${startYear}-${String(endYear).slice(-2)}`;
  };

  useEffect(() => {
    const storedSchool = localStorage.getItem('school_info');
    const storedToken = localStorage.getItem('school_token');

    if (storedSchool && storedToken) {
      try {
        setSchool(JSON.parse(storedSchool));
        // Retrieve academic years
        fetchAcademicYears();
      } catch (err) {
        console.error('Error parsing stored school info:', err);
        logout();
      }
    }
    
    // Set default active academic year
    setActiveAcademicYear(getDefaultAcademicYear());
    setLoading(false);
  }, []);

  // Poll school/user data every 5 minutes when the user is active and tab is visible
  useEffect(() => {
    if (!school) return;

    let lastInteraction = Date.now();
    const handleInteraction = () => {
      lastInteraction = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => document.addEventListener(event, handleInteraction));

    const checkAndFetch = () => {
      const isTabVisible = document.visibilityState === 'visible';
      const isRecentlyActive = Date.now() - lastInteraction < 5 * 60 * 1000;

      if (isTabVisible && isRecentlyActive) {
        fetchSchoolProfile();
      }
    };

    const interval = setInterval(checkAndFetch, 5 * 60 * 1000);

    return () => {
      events.forEach(event => document.removeEventListener(event, handleInteraction));
      clearInterval(interval);
    };
  }, [school]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/school/academic-years');
      setAcademicYears(response.data);
      if (response.data.length > 0) {
        // Use the most recent or default to first
        const active = response.data[0].academicYear;
        setActiveAcademicYear(active);
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err.message);
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      const response = await api.get('/school/profile');
      localStorage.setItem('school_info', JSON.stringify(response.data));
      setSchool(response.data);
    } catch (err) {
      console.error('Failed to fetch school profile:', err.message);
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...schoolData } = response.data;
      
      localStorage.setItem('school_token', token);
      localStorage.setItem('school_info', JSON.stringify(schoolData));
      setSchool(schoolData);
      
      // Fetch school's academic years
      await fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (schoolData) => {
    try {
      const response = await api.post('/auth/register', schoolData);
      const { token, ...data } = response.data;
      
      localStorage.setItem('school_token', token);
      localStorage.setItem('school_info', JSON.stringify(data));
      setSchool(data);

      await fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_info');
    setSchool(null);
    setAcademicYears([]);
    setActiveAcademicYear(getDefaultAcademicYear());
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await api.put('/school/profile', updatedData);
      localStorage.setItem('school_info', JSON.stringify(response.data));
      setSchool(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings.'
      };
    }
  };

  const addAcademicYear = async (yearStr) => {
    try {
      const response = await api.post('/school/academic-years', { academicYear: yearStr });
      setAcademicYears(prev => [response.data, ...prev]);
      setActiveAcademicYear(response.data.academicYear);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add academic year.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        school,
        loading,
        academicYears,
        activeAcademicYear,
        setActiveAcademicYear,
        login,
        register,
        logout,
        updateProfile,
        addAcademicYear,
        fetchAcademicYears
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
