import React, { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Box,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../firebase';
import backgroundImage from '../images/loginpagepic.jpeg';
import './SignupVendor.css';

// Styled Components (keep these as they're performance-neutral)
const StyledContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const BackgroundImage = styled('img')({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: -1,
  filter: 'blur(8px)',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '15px',
  maxWidth: '600px',
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
}));

const Signup_vendor = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    gstNumber: '',
    businessType: [],
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
    },
    phone: '',
    officePhone: '',
  });

  const validateForm = () => {
    if (!formData.businessName) return 'Business Name is required';
    if (formData.businessType.length === 0) return 'Select at least one business type';
    if (!formData.firstName) return 'First Name is required';
    if (!formData.lastName) return 'Last Name is required';
    if (!formData.email) return 'Email is required';
    if (!formData.email.includes('@')) return 'Invalid email format';
    if (!formData.password || formData.password.length < 6) 
      return 'Password must be at least 6 characters';
    if (!formData.address.street) return 'Street address is required';
    if (!formData.address.city) return 'City is required';
    if (!formData.address.state) return 'State is required';
    if (!formData.phone.match(/^[0-9]{10}$/)) return 'Phone number must be 10 digits';
    if (formData.officePhone && !formData.officePhone.match(/^[0-9]{10}$/))
      return 'Office phone number must be 10 digits';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBusinessTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      businessType: prev.businessType.includes(type)
        ? prev.businessType.filter(t => t !== type)
        : [...prev.businessType, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      await setDoc(doc(db, 'vendors', user.uid), {
        role: 'vendor',
        businessName: formData.businessName,
        gstNumber: formData.gstNumber,
        businessType: formData.businessType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        officePhone: formData.officePhone,
        createdAt: new Date(),
      });

      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
      <BackgroundImage src={backgroundImage} alt="Background" />
      <StyledPaper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1a237e' }}>
          Vendor Registration
        </Typography>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-section">
            <Typography variant="h6" gutterBottom>Business Details</Typography>
            <TextField
              name="businessName"
              label="Business Name"
              value={formData.businessName}
              onChange={handleChange}
              fullWidth
              required
              className="input-field"
            />

            <TextField
              name="gstNumber"
              label="GST Number"
              value={formData.gstNumber}
              onChange={handleChange}
              fullWidth
              className="input-field"
            />

            <Typography variant="subtitle1" gutterBottom>
              Business Type
            </Typography>
            <div className="checkbox-group">
              {['PVT Limited Company', 'Personal Business', 'Travel Agency'].map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={formData.businessType.includes(type)}
                      onChange={() => handleBusinessTypeChange(type)}
                    />
                  }
                  label={type}
                />
              ))}
            </div>
          </div>

          <div className="form-section">
            <Typography variant="h6" gutterBottom>Personal Details</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field"
              />
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </Box>

            <TextField
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              className="input-field"
            />

            <TextField
              name="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              className="input-field"
            />
          </div>

          <div className="form-section">
            <Typography variant="h6" gutterBottom>Office Address</Typography>
            <TextField
              name="address.street"
              label="Street Address"
              value={formData.address.street}
              onChange={handleChange}
              required
              fullWidth
              className="input-field"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="address.city"
                label="City"
                value={formData.address.city}
                onChange={handleChange}
                required
                className="input-field"
              />
              <TextField
                name="address.state"
                label="State"
                value={formData.address.state}
                onChange={handleChange}
                required
                className="input-field"
              />
            </Box>
          </div>

          <div className="form-section">
            <Typography variant="h6" gutterBottom>Contact Details</Typography>
            <TextField
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{ maxLength: 10 }}
              className="input-field"
            />

            <TextField
              name="officePhone"
              label="Office Phone Number"
              value={formData.officePhone}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 10 }}
              className="input-field"
            />
          </div>

          {error && (
            <Typography color="error" variant="body2" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <MuiLink href="/login" underline="hover">
              Log in
            </MuiLink>
          </Typography>
        </form>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Signup_vendor;