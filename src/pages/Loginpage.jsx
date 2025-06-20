import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  Box,
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import { Google as GoogleIcon, Email as EmailIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { app } from '../firebase';
import '../styles/Loginpage.css';

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #007BFF 0%, #00C4B4 100%)',
  padding: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '12px',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  background: '#fff',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  display: 'flex',
  justifyContent: 'center',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  fontSize: '16px',
  textTransform: 'none',
  borderRadius: '8px',
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5),
  border: '1px solid #ccc',
  borderRadius: '50%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: theme.palette.grey[100],
  },
}));

function Loginpage() {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRoleChange = (event, newRole) => {
    setRole(newRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please select User or Vendor');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role !== role) {
        setError(`This account is registered as a ${userDoc.data().role}, not a ${role}`);
        await auth.signOut();
        setLoading(false);
        return;
      }

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role,
          createdAt: new Date(),
        });
      }

      navigate(role === 'vendor' ? '/vendor/dashboard' : '/user/dashboard');
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = () => {
    navigate(role === 'vendor' ? '/signup_vendor' : '/signup_user');
  };

  const handleGoogleSignIn = async () => {
    if (!role) {
      setError('Please select User or Vendor');
      return;
    }

    if (role === 'vendor') {
      setError('Vendors must sign up using email. Please use the email signup option.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role !== 'user') {
        setError(`This account is registered as a ${userDoc.data().role}, not a user`);
        await auth.signOut();
        setLoading(false);
        return;
      }

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user',
          displayName: user.displayName,
          createdAt: new Date(),
        });
      }

      navigate('/user/dashboard');
    } catch (err) {
      setError('Google Sign-In failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send reset email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>
        {error && (
          <Alert severity={error.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <StyledToggleButtonGroup
          value={role}
          exclusive
          onChange={handleRoleChange}
          aria-label="role selection"
          fullWidth
        >
          <ToggleButton value="user" aria-label="user">
            User
          </ToggleButton>
          <ToggleButton value="vendor" aria-label="vendor">
            Vendor
          </ToggleButton>
        </StyledToggleButtonGroup>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            disabled={loading}
          />
          <MuiLink
            component="button"
            variant="body2"
            onClick={handleForgotPassword}
            sx={{ display: 'block', textAlign: 'right', mb: 2 }}
            disabled={loading}
          >
            Forgot Password?
          </MuiLink>
          <StyledButton
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !role}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </StyledButton>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          or Sign Up using
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <SocialButton onClick={handleEmailSignup} disabled={loading || !role}>
            <EmailIcon fontSize="large" />
          </SocialButton>
          <SocialButton onClick={handleGoogleSignIn} disabled={loading || !role}>
            <GoogleIcon fontSize="large" />
          </SocialButton>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <MuiLink
            component="button"
            onClick={handleEmailSignup}
            disabled={loading || !role}
            underline="hover"
          >
            Sign Up
          </MuiLink>
        </Typography>
      </StyledPaper>
    </StyledContainer>
  );
}

export default Loginpage;