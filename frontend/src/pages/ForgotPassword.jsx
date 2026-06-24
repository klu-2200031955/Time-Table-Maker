import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  School as SchoolIcon,
  Email,
  Phone,
  Lock,
  VpnKey
} from '@mui/icons-material';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState(1); // 1 = request, 2 = reset
  
  const [receivedCode, setReceivedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !mobile) {
      setError('Please fill in both Email and Mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email, mobile });
      setReceivedCode(response.data.resetCode);
      setSuccessMsg(`Simulated Verification Code generated: ${response.data.resetCode}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid details matching this school.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!inputCode || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (inputCode !== receivedCode) {
      setError('Invalid verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, newPassword });
      setSuccessMsg(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <SchoolIcon sx={{ fontSize: 36, color: '#1565c0' }} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e', textAlign: 'center' }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {step === 1 ? 'Enter your registered details to recover your account' : 'Verify the code and enter a new password'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}

          {step === 1 ? (
            <form onSubmit={handleRequestReset}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  required
                />

                <TextField
                  fullWidth
                  label="Registered Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    bgcolor: '#1a237e',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                    '&:hover': {
                      bgcolor: '#0d47a1'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Get Reset Code'}
                </Button>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Enter Verification Code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  required
                />

                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  required
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    bgcolor: '#1a237e',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                    '&:hover': {
                      bgcolor: '#0d47a1'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                </Button>
              </Box>
            </form>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#1565c0', fontWeight: 'bold', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
