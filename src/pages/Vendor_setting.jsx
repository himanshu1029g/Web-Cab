import React, { useState, useEffect } from 'react';
import {
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  getAuth, 
  updatePassword, 
  updateEmail, 
  EmailAuthProvider,
  reauthenticateWithCredential 
} from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebase';
import './VendorSetting.css';

const Vendor_setting = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    gstNumber: '',
    businessType: [],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    officePhone: '',
    address: {
      city: '',
      state: '',
      street: ''
    },
    newPassword: '',
    confirmPassword: ''
  });

  const showNotification = (type, text) => {
    setMessage({ type, text });
    // Clear notification after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const vendorDoc = await getDoc(doc(db, 'vendors', auth.currentUser.uid));
        if (vendorDoc.exists()) {
          const data = vendorDoc.data();
          setVendor({ id: vendorDoc.id, ...data });
          setFormData({
            businessName: data.businessName || '',
            gstNumber: data.gstNumber || '',
            businessType: data.businessType || [],
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            officePhone: data.officePhone || '',
            address: {
              city: data.address?.city || '',
              state: data.address?.state || '',
              street: data.address?.street || ''
            },
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (error) {
        showNotification('error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [auth.currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
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

  const validateForm = () => {
    if (!formData.businessName) return 'Business Name is required';
    if (!formData.firstName) return 'First Name is required';
    if (!formData.lastName) return 'Last Name is required';
    if (!formData.email) return 'Email is required';
    if (!formData.phone.match(/^[0-9]{10}$/)) return 'Valid Phone number is required';
    if (formData.officePhone && !formData.officePhone.match(/^[0-9]{10}$/)) 
      return 'Valid Office Phone number is required';
    if (!formData.address.city) return 'City is required';
    if (!formData.address.state) return 'State is required';
    if (!formData.address.street) return 'Street is required';
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) return 'Password must be at least 6 characters';
      if (formData.newPassword !== formData.confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      showNotification('error', error);
      return;
    }

    try {
      const updates = {
        businessName: formData.businessName,
        gstNumber: formData.gstNumber,
        businessType: formData.businessType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        officePhone: formData.officePhone,
        address: formData.address,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'vendors', vendor.id), updates);

      // If password change is requested
      if (formData.newPassword) {
        // Prompt for current password
        const currentPassword = window.prompt('Please enter your current password to continue');
        
        if (!currentPassword) {
          showNotification('error', 'Password update cancelled');
          return;
        }

        try {
          // Create credentials with current password
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
          );

          // Reauthenticate user
          await reauthenticateWithCredential(auth.currentUser, credential);
          
          // Now update password
          await updatePassword(auth.currentUser, formData.newPassword);
          showNotification('success', 'Password updated successfully!');
          setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (authError) {
          if (authError.code === 'auth/wrong-password') {
            showNotification('error', 'Current password is incorrect');
          } else {
            showNotification('error', 'Error updating password: ' + authError.message);
          }
          return;
        }
      }

      // If email change is requested
      if (formData.email !== auth.currentUser.email) {
        try {
          const currentPassword = window.prompt('Please enter your current password to update email');
          
          if (!currentPassword) {
            showNotification('error', 'Email update cancelled');
            return;
          }

          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
          );

          await reauthenticateWithCredential(auth.currentUser, credential);
          await updateEmail(auth.currentUser, formData.email);
          showNotification('success', 'Email updated successfully!');
        } catch (authError) {
          if (authError.code === 'auth/wrong-password') {
            showNotification('error', 'Current password is incorrect');
          } else {
            showNotification('error', 'Error updating email: ' + authError.message);
          }
          return;
        }
      }

      showNotification('success', 'Profile updated successfully!');
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="vendor-settings">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Vendor Settings</h1>
          {message.text && (
            <div className={`alert ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Business Information Section */}
          <div className="form-section">
            <h2>Business Information</h2>
            <div className="form-row">
              <TextField
                name="businessName"
                label="Business Name"
                value={formData.businessName}
                onChange={handleChange}
                fullWidth
                required
                className="input-field"
              />
            </div>

            <div className="form-row business-types">
              <h3>Business Type</h3>
              <div className="checkbox-group">
                {['PVT Limited Company', 'Personal Business', 'Travel Agency'].map((type) => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Checkbox
                        checked={formData.businessType.includes(type)}
                        onChange={() => handleBusinessTypeChange(type)}
                        className="custom-checkbox"
                      />
                    }
                    label={type}
                  />
                ))}
              </div>
            </div>

            <div className="form-row">
              <TextField
                name="gstNumber"
                label="GST Number"
                value={formData.gstNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Address Information Section */}
          <div className="form-section">
            <h2>Address Information</h2>
            <div className="form-row">
              <TextField
                name="address.street"
                label="Street Address"
                value={formData.address.street}
                onChange={handleChange}
                fullWidth
                required
                className="input-field"
              />
            </div>
            <div className="form-row two-columns">
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
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="form-section">
            <h2>Personal Information</h2>
            <div className="form-row two-columns">
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
            </div>

            <div className="form-row two-columns">
              <TextField
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                inputProps={{ maxLength: 10 }}
                className="input-field"
              />
              <TextField
                name="officePhone"
                label="Office Phone"
                value={formData.officePhone}
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
                className="input-field"
              />
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="form-section">
            <h2>Account Settings</h2>
            <div className="form-row">
              <TextField
                name="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div className="form-row two-columns">
              <TextField
                name="newPassword"
                type="password"
                label="New Password (optional)"
                value={formData.newPassword}
                onChange={handleChange}
                className="input-field"
              />
              <TextField
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              Save Changes
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/vendor/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Vendor_setting;