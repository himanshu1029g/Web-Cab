import "./App.css";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../src/firebase";
import Navbar from "./comp/Navbar";
import Home from "./pages/Home";
import Contact_us from "./pages/Contact_us";
import FeedbackPage from "./pages/FeedbackPage";
import Loginpage from "./pages/Loginpage";
import NotFound from "./pages/NotFound";
import Signup_user from "./pages/Signup_user";
import Signup_vendor from "./pages/Signup_vendor";
import CarSelection from "./pages/CarSelection";
import Booking from "./pages/Booking";
import VendorDashboard from "./comp/VendorDashboard";
import UserDashboard from "./comp/UserDashboard";
// import VendorDashboard from "./comp/VendorDashboard";
// import UserDashboard from "./comp/UserDashboard";

// Protected Route Component
const ProtectedRoute = ({ element, allowedRole }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        setUser(currentUser);
        setRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

// Layout component to wrap pages with Navbar
const Layout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/car-selection",
        element: <CarSelection />,
      },
      {
        path: "/contact_us",
        element: <Contact_us />,
      },
      {
        path: "/booking",
        element: <Booking />,
      },
      {
        path: "/feedback",
        element: <FeedbackPage />,
      },
      {
        path: "/signup_user",
        element: <Signup_user />,
      },
      {
        path: "/signup_vendor",
        element: <Signup_vendor />,
      },
      {
        path: "/login",
        element: <Loginpage />,
      },
      {
        path: "/vendor/dashboard",
        element: <ProtectedRoute element={<VendorDashboard />} allowedRole="vendor" />,
        // element: <ProtectedRoute element={<VendorDashboard />} allowedRole="vendor" />,
      },
      {
        path: "/user/dashboard",
        element: <ProtectedRoute element={<UserDashboard />} allowedRole="user" />,
        // element: <ProtectedRoute element={<UserDashboard />} allowedRole="user" />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;