import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebase';
import '../styles/Navbar.css';
import logo from '../images/Logo.jpg';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'user' or 'vendor'
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Monitor authentication state and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err.message);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="logo_pic" className="logo-img" />
        </Link>

        {/* Toggle Button for Mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact_us">Contact Us</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/feedback">Feedback</Link>
            </li>
          </ul>

          {/* Conditional Buttons */}
          <div className="navbar-buttons">
            {isAuthenticated ? (
              <>
                <Link
                  className="btn btn-success me-2"
                  to={userRole === 'vendor' ? '/vendor/dashboard' : '/user/dashboard'}
                >
                  Dashboard
                </Link>
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-primary me-2" to="/Signup_user">
                  User Signup
                </Link>
                <Link className="btn btn-primary" to="/Signup_vendor">
                  Vendor Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;