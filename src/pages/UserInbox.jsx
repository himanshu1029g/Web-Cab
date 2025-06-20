import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  runTransaction,
  deleteDoc,
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useState, useEffect } from "react"
import "../styles/UserInbox.css"
import { app } from "../firebase"
import PaymentButton from "../components/PaymentButton"

const UserInbox = () => {
  const navigate = useNavigate()
  const auth = getAuth(app)
  const db = getFirestore(app)

  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acceptedApplicationId, setAcceptedApplicationId] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "user") {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: userDoc.data().name || currentUser.displayName || "User",
          })
          fetchUserBookings(currentUser.uid)
        } else {
          setError("Not authorized as a user")
          navigate("/login")
        }
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [auth, db, navigate])

  const fetchUserBookings = async (userId) => {
    try {
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        date: doc.data().date ? new Date(doc.data().date) : new Date(),
      }))
      bookingsData.sort((a, b) => b.createdAt - a.createdAt)
      setBookings(bookingsData)
      setLoading(false)
    } catch (err) {
      setError("Error fetching bookings: " + err.message)
      setLoading(false)
    }
  }


  const fetchApplications = async (bookingId) => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const applicationsQuery = query(
        collection(db, "applications"),
        where("bookingId", "==", bookingId)
      );
      const snapshot = await getDocs(applicationsQuery);
      const applicationsData = snapshot.docs.map((doc) => ({
        id: doc.id, // This will be in the format bookingId_vendorId
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      applicationsData.sort((a, b) => b.createdAt - a.createdAt);
      setApplications(applicationsData);
      const acceptedApp = applicationsData.find((app) => app.status === "accepted");
      if (acceptedApp) {
        setAcceptedApplicationId(acceptedApp.id);
      } else {
        setAcceptedApplicationId(null);
      }
    } catch (err) {
      setError("Error fetching applications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function after fetchApplications
  const updateBookingStatus = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: status,
        updatedAt: new Date()
      });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: status }
          : booking
      ));
      
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: status } : prev);
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
    }
  };

  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking)
    await fetchApplications(booking.id)
  }

  const handleAcceptApplication = async (application) => {
    try {
      const applicationRef = doc(db, "applications", application.id);
      await updateDoc(applicationRef, {
        status: "accepted",
        updatedAt: new Date()
      });

      // Update booking status to 'accepted'
      await updateBookingStatus(selectedBooking.id, "accepted");

      // Reject other applications
      const otherApplications = applications.filter(app => app.id !== application.id);
      for (const app of otherApplications) {
        await updateDoc(doc(db, "applications", app.id), {
          status: "rejected",
          updatedAt: new Date()
        });
      }

      setAcceptedApplicationId(application.id);
      
      // Create notification for vendor
      await addDoc(collection(db, "notifications"), {
        type: "application_accepted",
        recipientId: application.vendorId,
        bookingId: selectedBooking.id,
        message: "Your application has been accepted!",
        createdAt: new Date(),
        read: false
      });

      // Refresh applications list
      await fetchApplications(selectedBooking.id);

    } catch (error) {
      setError("Error accepting application: " + error.message);
    }
  }

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return
    try {
      setLoading(true)
      await deleteDoc(doc(db, "bookings", bookingId))
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      setSelectedBooking(null)
      setApplications([])
    } catch (err) {
      setError("Error deleting booking: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "confirmed":
        return "status-badge confirmed"
      case "pending":
        return "status-badge pending"
      case "completed":
        return "status-badge completed"
      case "cancelled":
        return "status-badge cancelled"
      default:
        return "status-badge"
    }
  }

  if (loading && !bookings.length) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="user-inbox-dashboard">
      <aside className="sidebar">
        <h2>User Inbox</h2>
        <div className="profile-details">
          <div className="profile-name">{user?.displayName}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
        <button className="new-booking-button" onClick={() => navigate("/car-selection")}>
          + New Booking
        </button>
        <button className="back-button" onClick={() => navigate("/user/dashboard")}>
          Back to Dashboard
        </button>
      </aside>

      <main className="inbox-main-content">
        <section className="bookings-section">
          <h3>My Bookings</h3>
          {bookings.length === 0 ? (
            <p className="no-data">You don't have any bookings yet.</p>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`booking-item ${selectedBooking?.id === booking.id ? "selected" : ""}`}
                  onClick={() => handleSelectBooking(booking)}
                >
                  <div className="booking-item-header">
                    <span className="booking-date">{booking.date.toLocaleDateString()}</span>
                    <span className={getStatusBadgeClass(booking.status)}>{booking.status.toUpperCase()}</span>
                  </div>
                  <div className="booking-item-route">
                    <span className="route-from">{booking.from || "N/A"}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-to">{booking.to || "N/A"}</span>
                  </div>
                  <div className="booking-item-footer">
                    <span className="applications-count">
                      {booking.hasApplications ? "Has applications" : "No applications yet"}
                    </span>
                    <button
                      className="delete-booking-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBooking(booking.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="applications-section">
          {selectedBooking ? (
            <>
              <div className="selected-booking-details">
                <h3>Booking Details</h3>
                <div className="booking-details-card">
                  <div className="detail-row">
                    <span className="label">From:</span>
                    <span className="value">{selectedBooking.from || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">To:</span>
                    <span className="value">{selectedBooking.to || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Pickup Address:</span>
                    <span className="value">{selectedBooking.pickupAddress || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Drop Address:</span>
                    <span className="value">{selectedBooking.dropAddress || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">
                      {selectedBooking.date instanceof Date
                        ? selectedBooking.date.toLocaleDateString()
                        : selectedBooking.date}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">{selectedBooking.pickupTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Passengers:</span>
                    <span className="value">{selectedBooking.passengers}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={getStatusBadgeClass(selectedBooking.status)}>
                      {selectedBooking.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="applications-list">
                <h3>Vendor Applications</h3>
                {loading ? (
                  <div className="loading">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <p className="no-data">No vendor applications yet for this booking.</p>
                ) : 
                  applications.map((application) => (
                    <div className="application-card" key={application.id}>
                      <div className="application-header">
                        <h4>{application.companyName}</h4>
                        <span className={`status-badge ${application.status}`}>
                          {application.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="application-details">
                        <div className="detail-row">
                          <span className="label">Company name:</span>
                          <span className="value">{application.companyName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Driver:</span>
                          <span className="value">{application.driverName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Car Number:</span>
                          <span className="value">{application.carNumber}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Contact:</span>
                          <span className="value">{application.driverMobile}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Price Quote:</span>
                          <span className="value price">₹{application.price}</span>
                        </div>
                        {application.notes && (
                          <div className="detail-row">
                            <span className="label">Notes:</span>
                            <span className="value notes">{application.notes}</span>
                          </div>
                        )}
                      </div>
                      {selectedBooking.status === "pending" && application.status === "pending" && (
                        <div className="application-actions">
                          <button
                            className="accept-button"
                            onClick={() => handleAcceptApplication(application)}
                            disabled={!!acceptedApplicationId}
                          >
                            Accept Offer
                          </button>
                        </div>
                      )}
                      {application.status === "accepted" && (
                        <div className="acceptance-notice">
                          <p>You've accepted this offer!</p>
                          <button
                            className="view-ticket-button"
                            onClick={() => navigate(`/user/ticket/${selectedBooking.id}`)}
                          >
                            View Ticket
                          </button>
                        </div>
                      )}

                      {application.status === "accepted" && !application.paymentStatus && (
                        <PaymentButton 
                          application={application}
                          vendor={{
                            id: application.vendorId,
                            businessName: application.companyName
                          }}
                          currentUser={user}
                          onSuccess={() => handlePaymentSuccess(application.id, selectedBooking.id)}
                        />
                      )}

                      {application.paymentStatus === "paid" && (
                        <span className="success-text">Payment Completed</span>
                      )}
                    </div>
                  ))
                }
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a booking to view vendor applications</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserInbox;