// "use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"
import "../styles/Booking.css"
import { app } from "../firebase"

export default function Booking() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Safely handle undefined location.state
  const { carDetails = {}, routeDetails = {} } = location.state || {}

  const [formData, setFormData] = useState({
    fromState: routeDetails.fromState || "",
    toState: routeDetails.toState || "",
    passengers: "",
    names: "",
    user_name: "", // by me
    email: "",
    mobile: "",
    purpose: "",
    pickupTime: "",
    pickupAddress: routeDetails.fromAddress || "",
    dropAddress: routeDetails.toAddress || "",
    stops: "",
    stopAddresses: "",
    date: routeDetails.pickupDate || new Date().toISOString().split("T")[0],
    tripType: routeDetails.tripType || "one-way",
    from: routeDetails.from || "", // city/state only
    to: routeDetails.to || "",     // city/state only,
  })

  const [activeTab, setActiveTab] = useState("INCLUSIONS")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [auth, navigate])

  const handleChange = (e) => {
    const { user_name, name, value, type, checked } = e.target

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked ? value : "" })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to make a booking")
      return
    }

    try {
      setLoading(true)

      // Create booking document in Firestore
      const bookingData = {
        ...formData,
        from: routeDetails.from || "",
        to: routeDetails.to || "",
        fromState: routeDetails.fromState || "",
        toState: routeDetails.toState || "",
        pickupAddress: formData.pickupAddress, // full address
        dropAddress: formData.dropAddress,     // full address
        userId: user.uid,
        carDetails: carDetails || {},
        status: "pending",
        hasApplications: false,
        vendorId: null,
        createdAt: serverTimestamp(),
        price: carDetails.finalPrice || null,
      }

      const docRef = await addDoc(collection(db, "bookings"), bookingData)

      // Navigate to user inbox
      navigate("/user/inbox", {
        state: {
          bookingSuccess: true,
          bookingId: docRef.id,
        },
      })
    } catch (err) {
      setError("Error submitting booking: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Debug log to check received state
  console.log("Location State:", location.state)

  return (
    <div className="booking-container">
      {error && <div className="error-message">{error}</div>}

      {/* Contact & Pickup Details Form */}
      <div className="form-container">
        <h2>CONTACT & PICKUP DETAILS</h2>
        <form onSubmit={handleSubmit}>
          <label>Enter your name</label>
          <input
            type="string"
            name="user_name"
            placeholder="Enter your name"
            value={formData.user_name}
            onChange={handleChange}
            required
          />
          <label>No. of Passengers</label>
          <input
            type="number"
            name="passengers"
            placeholder="Enter no. of passengers"
            value={formData.passengers}
            onChange={handleChange}
            required
          />

          <label>No. of Male and Female Passengers</label>
          <input
            type="text"
            name="names"
            placeholder="Enter no. of male and female"
            value={formData.names}
            onChange={handleChange}
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email of any one passenger"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Mobile</label>
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile no. of any one passenger"
            value={formData.mobile}
            onChange={handleChange}
            required
          />

          <label>Purpose of Visit</label>
          <div className="purpose-options">
            {[" Business", " Tourism", " Family", " Not to say"].map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  name="purpose"
                  value={option}
                  checked={formData.purpose === option}
                  onChange={handleChange}
                />
                {option}
              </label>
            ))}
          </div>

          <label>Pickup Time</label>
          <input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} required />

          <label>Pickup Address</label>
          <input
            type="text"
            name="pickupAddress"
            placeholder="Enter the precise pickup address"
            value={formData.pickupAddress}
            onChange={handleChange}
            required
          />

          <label>Drop Address</label>
          <input
            type="text"
            name="dropAddress"
            placeholder="Enter the precise drop address"
            value={formData.dropAddress}
            onChange={handleChange}
            required
          />

          {/* <label>From State</label>
          <input
            type="text"
            name="fromState"
            placeholder="Enter the state of origin"
            value={formData.fromState}
            // readOnly
          />

          <label>To State</label>
          <input
            type="text"
            name="toState"
            placeholder="Enter the state of destination"
            value={formData.toState}
            // readOnly
          /> */}

          <label>No. of Stops</label>
          <input
            type="number"
            name="stops"
            placeholder="Enter the no. of stops"
            value={formData.stops}
            onChange={handleChange}
          />

          <label>Address of the Stops</label>
          <input
            type="text"
            name="stopAddresses"
            placeholder="Example: hotel, temple, or relative"
            value={formData.stopAddresses}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {/* Booking Details Section */}
      <div className="details-container">
        <h2>YOUR BOOKING DETAILS</h2>
        {/* Safely access routeDetails properties with validation */}
        <p>
          <strong>Itinerary:</strong>{" "}
          {routeDetails.from ? `${routeDetails.from} > ${routeDetails.to}` : "Source > Destination"}
        </p>
        <p>
          <strong>Pickup Date:</strong>{" "}
          {routeDetails.pickupDate && !isNaN(new Date(routeDetails.pickupDate.split("/").reverse().join("-")).getTime())
            ? routeDetails.pickupDate
            : "Not specified"}
        </p>{" "}
        {/* Validate and display */}
        <p>
          <strong>Route Type:</strong>{" "}
          {routeDetails.tripType ? routeDetails.tripType.replace("-", " ").toUpperCase() : "Not specified"}
        </p>
        <p>
          <strong>Car Type:</strong> {carDetails.name || "Not specified"}
        </p>
        <p>
          <strong>KMs Included:</strong> {carDetails.distance || 0} km
        </p>
        <p>
          <strong>Total Fare:</strong> ₹{carDetails.finalPrice?.toFixed(0) || "0"}
        </p>
        {/* Tabs for Details */}
        <div className="tab-container">
          {["INCLUSIONS", "EXCLUSIONS", "FACILITIES", "T&C"].map((tab) => (
            <div key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </div>
          ))}
        </div>
        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "INCLUSIONS" && (
            <>
              <p>✔ Base Fare for {carDetails.distance || 0} km</p>
              <p>✔ Driver Allowance</p>
              <p>✔ State Tax & Toll</p>
              <p>✔ GST (5%)</p>
            </>
          )}

          {activeTab === "EXCLUSIONS" && (
            <>
              <p>✘ Extra KMs beyond {carDetails.distance || 0} km</p>
              <p>✘ Parking Charges</p>
              <p>✘ Interstate Permit Fees</p>
            </>
          )}

          {activeTab === "FACILITIES" && (
            <>
              <p>💡 AC available</p>
              <p>🚗 Clean and Sanitized Cars</p>
              <p>📶 Mobile Charging Point</p>
            </>
          )}

          {activeTab === "T&C" && (
            <>
              <p>⚠️ Refund on cancellation within 24 hours</p>
              <p>⚠️ GST applicable as per Govt. rules</p>
              <p>⚠️ Fare may vary with route/time</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
