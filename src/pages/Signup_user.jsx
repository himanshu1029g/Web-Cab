import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { app } from '../firebase';
import '../styles/UserSignup.css';

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

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  fontSize: '16px',
  textTransform: 'none',
  borderRadius: '8px',
}));

const GoogleButton = styled(IconButton)(({ theme }) => ({
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

const UserSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phoneNumber,
        role: 'user',
        createdAt: new Date(),
      });

      navigate('/user/dashboard');
    } catch (err) {
      setError('Signup failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if email exists in vendors collection
      const vendorsRef = collection(db, 'vendors');
      const q = query(vendorsRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError('This email is registered as a vendor. Please use vendor signup.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        if (userDoc.data().role !== 'user') {
          setError('This Google account is registered as a vendor. Please use email signup.');
          await auth.signOut();
          setLoading(false);
          return;
        }
        navigate('/user/dashboard');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'User',
        email: user.email,
        phoneNumber: '', // Optional for Google Sign-Up
        role: 'user',
        createdAt: new Date(),
      });

      navigate('/user/dashboard');
    } catch (err) {
      setError('Google Signup failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          User Signup
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            type="text"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            variant="outlined"
            disabled={loading}
          />
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
            label="Phone Number"
            type="tel"
            fullWidth
            margin="normal"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            variant="outlined"
            placeholder="1234567890"
            inputProps={{ maxLength: 10 }}
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
          <StyledButton
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </StyledButton>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          or Sign Up with
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <GoogleButton onClick={handleGoogleSignup} disabled={loading}>
            <GoogleIcon fontSize="large" />
          </GoogleButton>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <MuiLink component="button" onClick={() => navigate('/login')} underline="hover">
            Login
          </MuiLink>
        </Typography>
      </StyledPaper>
    </StyledContainer>
  );
};

export default UserSignup;