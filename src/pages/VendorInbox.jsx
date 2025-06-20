// "use client"

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import "../styles/VendorInbox.css";
import { app } from "../firebase";

const VendorInbox = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [vendor, setVendor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]); // New state for notifications
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // const userDoc = await getDoc(doc(db, "users", user.uid));
        const userDoc = await getDoc(doc(db, "vendors", user.uid));
        if (userDoc.exists() && userDoc.data().role === "vendor") {
          setVendor({
            uid: user.uid,
            email: user.email,
            displayName:
              userDoc.data().businessName || user.displayName || "Vendor",
          });
          fetchAvailableBookings();
          fetchVendorApplications(user.uid);
          fetchNotifications(user.uid); // Fetch notifications
        } else {
          setError("Not authorized as a vendor");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  const fetchAvailableBookings = async () => {
    try {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("status", "==", "pending"),
        where("vendorId", "==", null)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      bookingsData.sort((a, b) => b.createdAt - a.createdAt);
      setBookings(bookingsData);
      setLoading(false);
    } catch (err) {
      setError("Error fetching bookings: " + err.message);
      setLoading(false);
    }
  };

  const fetchVendorApplications = async (vendorId) => {
    try {
      setLoading(true);
      const applicationsQuery = query(
        collection(db, "applications"),
        where("vendorId", "==", vendorId) 
      );
      
      const snapshot = await getDocs(applicationsQuery);
      const applicationsPromises = snapshot.docs.map(async (docSnap) => {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date()
        };

        if (data.bookingId) {
          try {
            // Fetch booking details
            const bookingRef = doc(db, "bookings", data.bookingId);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
              const bookingData = bookingSnap.data();
              
              // Fetch user details
              const userDoc = await getDoc(doc(db, "users", bookingData.userId));
              const userDetails = userDoc.exists() ? userDoc.data() : null;

              data.booking = {
                id: data.bookingId,
                ...bookingData,
                date: bookingData.date ? new Date(bookingData.date) : null,
                userDetails: {
                  name: userDetails?.name || userDetails?.displayName || "N/A",
                  email: userDetails?.email || "N/A",
                  mobile: userDetails?.phoneNumber || "N/A"
                }
              };
            }
          } catch (err) {
            console.error(`Error fetching booking ${data.bookingId}:`, err);
            data.booking = null;
          }
        }
        return data;
      });

      const applicationsData = await Promise.all(applicationsPromises);
      applicationsData.sort((a, b) => b.createdAt - a.createdAt);
      setApplications(applicationsData);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to fetch applications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (vendorId) => {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("recipientId", "==", vendorId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(notificationsQuery);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Fetch booking details for each notification
      const notificationsWithBookings = await Promise.all(
        notificationsData.map(async (notification) => {
          if (notification.bookingId) {
            const bookingDoc = await getDoc(doc(db, "bookings", notification.bookingId));
            if (bookingDoc.exists()) {
              return {
                ...notification,
                booking: {
                  id: bookingDoc.id,
                  ...bookingDoc.data(),
                  date: bookingDoc.data().date ? new Date(bookingDoc.data().date) : new Date()
                }
              };
            }
          }
          return notification;
        })
      );

      setNotifications(notificationsWithBookings);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Error fetching notifications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        updatedAt: serverTimestamp(),
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      setError("Error marking notification as read: " + err.message);
    }
  };

  const handleApply = (bookingId) => {
    navigate(`/vendor/apply/${bookingId}`);
  };

  const handleDeleteApplication = async (applicationId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this application?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "applications", applicationId));
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    } catch (err) {
      alert("Failed to delete application: " + err.message);
    }
  };

  const handleViewBookingInfo = (bookingId) => {
    navigate(`/vendor/booking-info/${bookingId}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "accepted":
        return "status-badge accepted";
      case "rejected":
        return "status-badge rejected";
      case "pending":
        return "status-badge pending";
      default:
        return "status-badge";
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  {error && (
    <div className="error-message">
      <p>{error}</p>
      <button onClick={() => setError(null)}>Dismiss</button>
    </div>
  )}

  return (
    <div className="vendor-inbox-container">
      <h1>Vendor Inbox</h1>

      <div className="inbox-tabs">
        <button
          className={activeTab === "available" ? "active" : ""}
          onClick={() => setActiveTab("available")}
        >
          Available Requests
        </button>
        <button
          className={activeTab === "applications" ? "active" : ""}
          onClick={() => setActiveTab("applications")}
        >
          My Applications
        </button>
        <button
          className={activeTab === "notifications" ? "active" : ""}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
      </div>

      {activeTab === "available" && (
        <div className="bookings-list">
          <h2>Available Service Requests</h2>
          {bookings.length === 0 ? (
            <p className="no-data">
              No available service requests at the moment.
            </p>
          ) : (
            bookings.map((booking) => (
              <div className="booking-card" key={booking.id}>
                <div className="booking-header">
                  <h3>Booking #{booking.id.substring(0, 6)}</h3>
                  <span className="date">
                    {booking.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">From </span>
                    <span className="value">{booking.from || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">To :</span>
                    <span className="value">{booking.to || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Pickup Address:</span>
                    <span className="value">{booking.pickupAddress}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Drop Address:</span>
                    <span className="value">{booking.dropAddress}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">{booking.pickupTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Passengers:</span>
                    <span className="value">{booking.passengers}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Vehicle Type:</span>
                    <span className="value">{booking.carDetails?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Pickup Date:</span>
                    <span className="value">{booking.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total Fare:</span>
                    <span className="value">
                      ₹{booking.carDetails?.finalPrice}
                    </span>
                  </div>
                </div>
                <div className="booking-actions">
                  <button
                    className="apply-button"
                    onClick={() => handleApply(booking.id)}
                  >
                    Apply for Service
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "applications" && (
        <div className="applications-list">
          <h2>My Applications</h2>
          {applications.length === 0 ? (
            <p className="no-data">
              You haven't applied to any service requests yet.
            </p>
          ) : (
            applications.map((application) => (
              <div className="application-card" key={application.id}>
                <div className="application-header">
                  <h3>Application #{application.id.substring(0, 6)}</h3>
                  <span className={getStatusBadgeClass(application.status)}>
                    {application.status.toUpperCase()}
                  </span>
                </div>
                <div className="application-details">
                  <div className="detail-row">
                    <span className="label">From:</span>
                    <span className="value">
                      {application.booking?.from || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">To:</span>
                    <span className="value">
                      {application.booking?.to || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">
                      {application.booking?.date
                        ? new Date(
                            application.booking.date
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Your Quote:</span>
                    <span className="value">₹{application.price}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Applied On:</span>
                    <span className="value">
                      {application.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {application.status === "accepted" && (
                  <div className="acceptance-notice">
                    <p>You've been selected for this booking!</p>
                    <button 
                      className="view-booking-info-btn"
                      onClick={() => handleViewBookingInfo(application.bookingId)}
                    >
                      View Booking Info
                    </button>
                  </div>
                )}
                <div className="application-actions">
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteApplication(application.id)}
                  >
                    Delete Application
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="notifications-list">
          <h2>Notifications</h2>
          {notifications.length === 0 ? (
            <p className="no-data">No notifications at the moment.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.read ? "unread" : ""}`}
                onClick={() => notification.bookingId && handleViewBookingInfo(notification.bookingId)}
              >
                <div className="notification-header">
                  <div className="notification-type">
                    {notification.type === "booking_accepted" && "🎉 Booking Accepted"}
                    {notification.type === "new_booking" && "🆕 New Booking"}
                    {notification.type === "payment_received" && "💰 Payment Received"}
                  </div>
                  <span className="notification-time">
                    {notification.createdAt.toLocaleString()}
                  </span>
                </div>
                
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.booking && (
                    <div className="booking-preview">
                      <div className="booking-details">
                        <span>From: {notification.booking.from}</span>
                        <span>To: {notification.booking.to}</span>
                        <span>Date: {notification.booking.date.toLocaleDateString()}</span>
                        <span>Time: {notification.booking.pickupTime}</span>
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBookingInfo(notification.bookingId);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>

                {!notification.read && (
                  <button
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <button
        className="back-button"
        onClick={() => navigate("/vendor/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default VendorInbox;
