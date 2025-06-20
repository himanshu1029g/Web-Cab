"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/Apply.css";
import { app } from "../firebase";

const Apply = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [formData, setFormData] = useState({
    companyName: "",
    driverName: "",
    carNumber: "",
    driverMobile: "",
    email: "",
    companyMobile: "",
    price: "",
    notes: "",
    fromState: "",
    toState: "",
    pickupAddress: "",
    dropAddress: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
        if (bookingDoc.exists()) {
          setBooking(bookingDoc.data());
          setFormData((prev) => ({
            ...prev,
            fromState: bookingDoc.data().fromState || "",
            toState: bookingDoc.data().toState || "",
            pickupAddress: bookingDoc.data().pickupAddress || "",
            dropAddress: bookingDoc.data().dropAddress || "",
          }));
        } else {
          setError("Booking not found");
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Error fetching booking: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, auth, db, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const {
      companyName,
      driverName,
      carNumber,
      driverMobile,
      email,
      companyMobile,
      price,
    } = formData;
    if (
      !companyName ||
      !driverName ||
      !carNumber ||
      !driverMobile ||
      !email ||
      !companyMobile ||
      !price
    ) {
      return "All required fields must be filled";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    // const phoneRegex = /^\d{10}$/;
    // if (!phoneRegex.test(driverMobile) || !phoneRegex.test(companyMobile)) {
    //   return "Phone numbers must be 10 digits";
    // }
    if (parseFloat(price) <= 0) {
      return "Price must be a positive number";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setError("You must be logged in to apply");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // Verify vendor role
      const vendorDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!vendorDoc.exists() || vendorDoc.data().role !== "vendor") {
        setError("Only vendors can apply for bookings");
        return;
      }

      const vendorData = vendorDoc.data();
      const applicationData = {
        bookingId,
        vendorId: auth.currentUser.uid,
        userId: booking.userId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyName: formData.companyName,
        driverName: formData.driverName,
        carNumber: formData.carNumber,
        driverMobile: formData.driverMobile,
        email: formData.email,
        companyMobile: formData.companyMobile,
        price: formData.price,
        notes: formData.notes || "",
        fromState: formData.fromState,
        toState: formData.toState,
        pickupAddress: formData.pickupAddress,
        dropAddress: formData.dropAddress,
        vendorDetails: {
          name: formData.companyName,
          driverName: formData.driverName,
          carNumber: formData.carNumber,
          driverMobile: formData.driverMobile,
          companyMobile: formData.companyMobile,
          email: formData.email,
          phone: vendorData.phone || "Not Provided",
        },
      };

      console.log("Submitting application data:", applicationData);

      console.log("--- Creating Application Data ---");
      console.log("Application Data:", applicationData);
      console.log("Booking Object:", booking);
      console.log("Booking userId:", booking.userId);
      console.log("Current Vendor uid:", auth.currentUser.uid);

      // Create application document with custom ID
      const applicationId = `${bookingId}_${auth.currentUser.uid}`;
      const applicationRef = doc(db, "applications", applicationId);
      await setDoc(applicationRef, applicationData);

      // Update booking to indicate it has applications
      await setDoc(
        doc(db, "bookings", bookingId),
        { hasApplications: true, updatedAt: serverTimestamp() },
        { merge: true }
      );

      navigate("/vendor/inbox");
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(`Error submitting application: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!booking) return <div className="error">Booking not found</div>;

  return (
    <div className="apply-container">
      <h1>Apply for Service</h1>

      <div className="booking-details">
        <h2>Booking Details</h2>
        <div className="details-grid">
          <div>
            <p>
              <strong>From:</strong> {booking.from}
            </p>
            <p>
              <strong>To:</strong> {booking.to}
            </p>
            <p>
              <strong>Date:</strong> {booking.date}
            </p>
            <p>
              <strong>Pickup Address:</strong> {booking.pickupAddress}
            </p>
            <p>
              <strong>Drop Address:</strong> {booking.dropAddress}
            </p>
          </div>
          <div>
            <p>
              <strong>Passengers:</strong> {booking.passengers}
            </p>
            <p>
              <strong>Pickup Time:</strong> {booking.pickupTime}
            </p>
            <p>
              <strong>Trip Type:</strong> {booking.tripType}
            </p>
            <p>
              <strong>Vehicle Type:</strong> {booking.carDetails?.name || "N/A"}
            </p>
            <p>
              <strong>Total Fare:</strong> ₹
              {booking.carDetails?.finalPrice || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="apply-form">
        <h2>Service Provider Details</h2>

        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="driverName">Driver Name</label>
          <input
            type="text"
            id="driverName"
            name="driverName"
            value={formData.driverName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="carNumber">Car Number</label>
            <input
              type="text"
              id="carNumber"
              name="carNumber"
              value={formData.carNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="driverMobile">Driver Mobile</label>
            <input
              type="tel"
              id="driverMobile"
              name="driverMobile"
              value={formData.driverMobile}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyMobile">Company Mobile</label>
            <input
              type="tel"
              id="companyMobile"
              name="companyMobile"
              value={formData.companyMobile}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price Quote (₹)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="300"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/vendor/inbox")}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default Apply;