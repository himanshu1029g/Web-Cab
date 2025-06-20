"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import "../styles/VendorDashboard.css"
import { app } from "../firebase"

const VendorDashboard = () => {
  const navigate = useNavigate()
  const auth = getAuth(app)
  const db = getFirestore(app)
  const [vendor, setVendor] = useState(null)
  const [applications, setApplications] = useState([])
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("bookings")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "vendors", user.uid))
        // const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists() && userDoc.data().role === "vendor") {
          setVendor({
            uid: user.uid,
            email: user.email,
            displayName: userDoc.data().displayName || user.displayName || "Vendor",
            location: userDoc.data().address?.city || "Unknown",
            businessName: userDoc.data().address?.business || "Travel Agency",
          })
          fetchVendorApplications(user.uid)
          fetchVendorTransactions(user.uid); // Add this line
        } else {
          setError("Not authorized as a vendor")
          await auth.signOut()
          navigate("/login")
        }
      } else {
        navigate("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [auth, navigate, db])

  const fetchVendorApplications = async (vendorId) => {
    try {
      setLoading(true);
      // First fetch applications
      const applicationsQuery = query(
        collection(db, "applications"),
        //  changes by me 
        where("vendorId", "==", vendorId)  
        // orderBy("createdAt", "desc") 
      );
      
      const snapshot = await getDocs(applicationsQuery);
      const applicationsPromises = snapshot.docs.map(async (docSnap) => {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date()
        };

        // Fetch booking details if bookingId exists
        if (data.bookingId) {
          try {
            const bookingRef = doc(db, "bookings", data.bookingId);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
              const bookingData = bookingSnap.data();
              data.booking = {
                id: data.bookingId,
                from: bookingData.from || "N/A",
                to: bookingData.to || "N/A",
                date: bookingData.date ? new Date(bookingData.date) : null,
                pickupTime: bookingData.pickupTime || "N/A",
                passengers: bookingData.passengers || "N/A"
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
      setApplications(applicationsData);
      //  changes by me 
      applicationsData.sort((a, b) => b.createdAt - a.createdAt);
      setApplications(applicationsData);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to fetch applications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorTransactions = async (vendorId) => {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("vendorId", "==", vendorId)
      );
      const snapshot = await getDocs(transactionsQuery);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setTransactions(transactionsData.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  if (loading) return <div>Loading...</div>

  {error && (
    <div className="error-message">
      <p>{error}</p>
      <button onClick={() => setError(null)}>Dismiss</button>
    </div>
  )}

  // Filtered lists
  const bookings = applications.filter(a => a.status === "accepted" || a.status === "confirmed")
  const pending = applications.filter(a => a.status === "pending")
  const applied = applications // all applications

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Vendor Panel</h2>
        <ul>
          <li onClick={() => navigate("/vendor/inbox")}>Inbox</li>
          <li onClick={() => navigate("/vendor/dashboard")}>Dashboard</li>
          <li onClick={() => navigate("/vendor/settings")}>Settings</li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {vendor?.displayName}</h1>
        </header>

        <section className="vendor-profile">
          <div className="profile-details">
            <h2>{vendor?.businessName}</h2>
            <p>Email: {vendor?.email}</p>
            <p>Name: {vendor?.displayName}</p>
            <p>Location: {vendor?.location}</p>
          </div>
        </section>

        <section className="dashboard-tabs" style={{ margin: "24px 0" }}>
          <button className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>
            Bookings ({bookings.length})
          </button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
            Pending ({pending.length})
          </button>
          <button className={activeTab === "applied" ? "active" : ""} onClick={() => setActiveTab("applied")}>
            Applied ({applied.length})
          </button>
          <button 
            className={activeTab === "transactions" ? "active" : ""} 
            onClick={() => setActiveTab("transactions")}
          >
            Transactions ({transactions.length})
          </button>
        </section>

        <section className="dashboard-content">
          {activeTab === "bookings" && (
            <>
              <h2>Accepted/Confirmed Bookings</h2>
              {bookings.length === 0 ? (
                <p>No bookings found.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Booking ID</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Price Quote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((a) => (
                      <tr key={a.id}>
                        <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
                        <td>{a.status}</td>
                        <td>{a.bookingId?.substring(0, 8) || "-"}</td>
                        <td>{a.booking?.from || "-"}</td>
                        <td>{a.booking?.to || "-"}</td>
                        <td>₹{a.price || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === "pending" && (
            <>
              <h2>Pending Applications</h2>
              {pending.length === 0 ? (
                <p>No pending applications.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Booking ID</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Price Quote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((a) => (
                      <tr key={a.id}>
                        <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
                        <td>{a.status}</td>
                        <td>{a.bookingId?.substring(0, 8) || "-"}</td>
                        <td>{a.booking?.from || "-"}</td>
                        <td>{a.booking?.to || "-"}</td>
                        <td>₹{a.price || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === "applied" && (
            <>
              <h2>All Applied Applications</h2>
              {applied.length === 0 ? (
                <p>No applications found.</p>
              ) : (
                <div className="applications-list">
                  {applications.map((application) => (
                    <div className="application-card" key={application.id}>
                      <div className="application-header">
                        <h3>Application #{application.id.substring(0, 6)}</h3>
                        <span className={`status-badge ${application.status}`}>
                          {application.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="application-details">
                        <div className="detail-row">
                          <span className="label">From:</span>
                          <span className="value">{application.booking?.from}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">To:</span>
                          <span className="value">{application.booking?.to}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Date:</span>
                          <span className="value">
                            {application.booking?.date?.toLocaleDateString() || "N/A"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Your Quote:</span>
                          <span className="value">₹{application.price}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Status:</span>
                          <span className={`value status-${application.status}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "transactions" && (
            <>
              <h2>Payment Transactions</h2>
              {transactions.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payment ID</th>
                      <th>Booking ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.timestamp.toLocaleDateString()}</td>
                        <td>{transaction.paymentId}</td>
                        <td>{transaction.bookingId.substring(0, 8)}</td>
                        <td>₹{transaction.amount}</td>
                        <td>
                          <span className={`status-badge ${transaction.status}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default VendorDashboard