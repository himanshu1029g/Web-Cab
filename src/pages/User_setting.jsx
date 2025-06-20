import React, { useState, useEffect } from 'react';
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
import './UserSetting.css';

const User_setting = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({ id: userDoc.id, ...data });
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (error) {
        showNotification('error', 'Error fetching user data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth, navigate]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    // Clear message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate phone number
      if (!formData.phone.match(/^[0-9]{10}$/)) {
        showNotification('error', 'Please enter a valid 10-digit phone number');
        return;
      }

      const updates = {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date()  // Add timestamp for update
      };

      // Update Firestore document
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
      showNotification('success', 'Profile updated successfully!');

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

      // If password change is requested
      if (formData.newPassword) {
        try {
          const currentPassword = window.prompt('Please enter your current password to change password');
          
          if (!currentPassword) {
            showNotification('error', 'Password update cancelled');
            return;
          }

          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
          );

          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, formData.newPassword);
          showNotification('success', 'Password updated successfully!');
          setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (authError) {
          showNotification('error', 'Error updating password: ' + authError.message);
        }
      }

    } catch (error) {
      showNotification('error', error.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="user-settings">
      <div className="settings-container">
        <div className="settings-header">
          <h1>User Settings</h1>
          {message.text && (
            <div className={`alert ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <h2>Personal Information</h2>
            <div className="form-row">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="input-field"
              />
            </div>

            <div className="form-row">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                maxLength="10"
                className="input-field"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Account Settings</h2>
            <div className="form-row">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="input-field"
              />
            </div>

            <div className="form-row two-columns">
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password (optional)"
                className="input-field"
              />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
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
              onClick={() => navigate('/user/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default User_setting;