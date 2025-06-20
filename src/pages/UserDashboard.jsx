import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import "../styles/UserDashboard.css"
import { app } from "../firebase"

const UserDashboard = () => {
  const navigate = useNavigate()
  const auth = getAuth(app)
  const db = getFirestore(app)
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [applications, setApplications] = useState([])
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("rides")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "user") {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            phoneNumber: userDoc.data().phone || "Not provided",
            displayName: userDoc.data().name || currentUser.displayName || "User",
          })
          fetchUserData(currentUser.uid)
          fetchUserTransactions(currentUser.uid); // Add this line
        } else {
          setError("Not authorized as a user")
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

  const fetchUserData = async (userId) => {
    try {
      // Fetch bookings
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date
          ? new Date(doc.data().date.split("/").reverse().join("-") + "T00:00:00")
          : new Date(),
      }))
      bookingsData.sort((a, b) => b.date - a.date)
      setBookings(bookingsData)

      // Fetch all applications for user's bookings
      const bookingIds = bookingsSnapshot.docs.map((doc) => doc.id)
      let allApplications = []
      if (bookingIds.length > 0) {
        const applicationsQuery = query(collection(db, "applications"), where("bookingId", "in", bookingIds.slice(0, 10)))
        // Firestore "in" supports max 10 items, so for more, loop in batches
        const appsSnapshot = await getDocs(applicationsQuery)
        allApplications = appsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      }
      setApplications(allApplications)
    } catch (err) {
      setError("Failed to fetch data: " + err.message)
    }
  }

  const fetchUserTransactions = async (userId) => {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId)
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

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (err) {
      setError("Logout failed: " + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  // Tab data
  const rides = bookings
  const pending = bookings.filter((b) => b.status === "pending")
  const applicationsTab = applications

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>User Panel</h2>
        <ul>
          <li onClick={() => setActiveTab("rides")} className={activeTab === "rides" ? "active" : ""}>Rides</li>
          <li onClick={() => setActiveTab("applications")} className={activeTab === "applications" ? "active" : ""}>Applications</li>
          <li onClick={() => setActiveTab("pending")} className={activeTab === "pending" ? "active" : ""}>Pending</li>
          {/*  changes by me  */}
          <li onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "active" : ""}>Settings</li>
          <li style={{ marginTop: "2rem" }}>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {user?.displayName}</h1>
        </header>

        <section className="user-profile">
          <div className="profile-details">
            <h2>{user?.displayName}</h2>
            <p>Email: {user?.email}</p>
            <p>Phone number: {user?.phoneNumber}</p>
          </div>
        </section>

        <section className="dashboard-tabs" style={{ margin: "24px 0" }}>
          <button className={activeTab === "rides" ? "active" : ""} onClick={() => setActiveTab("rides")}>
            Rides ({rides.length})
          </button>
          <button className={activeTab === "applications" ? "active" : ""} onClick={() => setActiveTab("applications")}>
            Applications ({applicationsTab.length})
          </button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
            Pending ({pending.length})
          </button>
          <button 
            className={activeTab === "transactions" ? "active" : ""} 
            onClick={() => setActiveTab("transactions")}
          >
            Payments ({transactions.length})
          </button>
        </section>

        <section className="dashboard-content">
          {activeTab === "rides" && (
            <>
              <h2>All Rides</h2>
              {rides.length === 0 ? (
                <p>No rides found.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Pickup Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.date.toLocaleDateString()}</td>
                        <td>{ride.from}</td>
                        <td>{ride.to}</td>
                        <td>{ride.status}</td>
                        <td>{ride.pickupTime}</td>
                        <td>
                          <button className="view-btn" onClick={() => navigate(`/user/inbox?booking=${ride.id}`)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === "applications" && (
            <>
              <h2>Vendor Applications</h2>
              {applicationsTab.length === 0 ? (
                <p>No vendor applications found.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Vendor</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsTab.map((app) => (
                      <tr key={app.id}>
                        <td>{app.bookingId?.substring(0, 8)}</td>
                        <td>{app.companyName || app.vendorId}</td>
                        <td>₹{app.price}</td>
                        <td>{app.status}</td>
                        <td>
                          <button className="view-btn" onClick={() => navigate(`/user/inbox?booking=${app.bookingId}`)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === "pending" && (
            <>
              <h2>Pending Rides</h2>
              {pending.length === 0 ? (
                <p>No pending rides.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Pickup Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.date.toLocaleDateString()}</td>
                        <td>{ride.from}</td>
                        <td>{ride.to}</td>
                        <td>{ride.status}</td>
                        <td>{ride.pickupTime}</td>
                        <td>
                          <button className="view-btn" onClick={() => navigate(`/user/inbox?booking=${ride.id}`)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
    {/*  changes by me  */}
          {activeTab === "settings" && (
            navigate("/user/settings") // Redirect to settings page
          )}

          {activeTab === "transactions" && (
            <>
              <h2>Payment History</h2>
              {transactions.length === 0 ? (
                <p>No payment history found.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payment ID</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.timestamp.toLocaleDateString()}</td>
                        <td>{transaction.paymentId}</td>
                        <td>{transaction.vendorName || "Unknown Vendor"}</td>
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

export default UserDashboard
