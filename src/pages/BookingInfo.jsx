import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/BookingInfo.css";

const BookingInfo = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bookingRef = useRef(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
        if (bookingDoc.exists()) {
          const bookingData = bookingDoc.data();

          // Fetch user details
          const userDoc = await getDoc(doc(db, "users", bookingData.userId));
          const userDetails = userDoc.exists() ? userDoc.data() : null;

          // First get all applications for this booking to find the accepted one
          const applicationsQuery = query(
            collection(db, "applications"),
            where("bookingId", "==", bookingId),
            where("status", "==", "accepted")
          );
          const applicationSnap = await getDocs(applicationsQuery);
          const applicationData = !applicationSnap.empty ? applicationSnap.docs[0].data() : null;

          setBooking({
            id: bookingDoc.id,
            ...bookingData,
            date: bookingData.date ? new Date(bookingData.date) : new Date(),
            userDetails: {
              name: userDetails?.name || userDetails?.displayName || "N/A",
              email: userDetails?.email || "N/A",
              mobile: userDetails?.phoneNumber || "N/A",
            },
            vendorDetails: applicationData ? {
              companyName: applicationData.companyName || applicationData.businessName,  // Check both possible field names
              driverName: applicationData.driverName,
              carNumber: applicationData.carNumber,
              driverMobile: applicationData.driverMobile || applicationData.driverPhone,  // Check both possible field names
              price: applicationData.price || applicationData.quotedPrice,  // Check both possible field names
              notes: applicationData.notes
            } : null
          });

          console.log("Application Data:", applicationData); // For debugging
        } else {
          setError("Booking not found");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Error fetching booking details: " + err.message);
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, db]);

  const handleDownloadPDF = async () => {
    try {
      const element = bookingRef.current;
      if (!element) {
        console.error("Booking element not found");
        return;
      }

      // Set temporary styles for better PDF generation
      const originalStyle = element.style.background;
      element.style.background = 'white';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
      });

      // Reset styles
      element.style.background = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));

      // If content is longer than one page, add additional pages
      if (imgHeight > pdfHeight) {
        let heightLeft = imgHeight - pdfHeight;
        let position = -pdfHeight;

        while (heightLeft >= 0) {
          position = position - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(`Booking_${booking.id.substring(0, 6)}.pdf`);

    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!booking) return <div className="error">Booking not found</div>;

  return (
    <div className="booking-info-container">
      <div className="booking-info" ref={bookingRef}>
        <div className="booking-header">
          <h1>Booking Information</h1>
          <span className="booking-id">#{booking.id.substring(0, 6)}</span>
        </div>

        <div className="booking-status">
          <span className={`status-badge ${booking.status}`}>
            {booking.status.toUpperCase()}
          </span>
        </div>

        <div className="booking-grid">
          <div className="info-section">
            <h2>Customer Details</h2>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">
                {booking.userDetails?.name || "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Mobile:</span>
              <span className="value">
                {booking.userDetails?.mobile || "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">
                {booking.userDetails?.email || "N/A"}
              </span>
            </div>
          </div>

          <div className="info-section">
            <h2>Journey Details</h2>
            <div className="detail-row">
              <span className="label">From:</span>
              <span className="value">{booking.from}</span>
            </div>
            <div className="detail-row">
              <span className="label">To:</span>
              <span className="value">{booking.to}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{booking.date.toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Time:</span>
              <span className="value">{booking.pickupTime}</span>
            </div>
          </div>

          <div className="info-section">
            <h2>Vehicle Details</h2>
            <div className="detail-row">
              <span className="label">Vehicle Type:</span>
              <span className="value">{booking.carDetails?.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Company Name:</span>
              <span className="value">{booking.vendorDetails?.companyName || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Car Number:</span>
              <span className="value">{booking.vendorDetails?.carNumber || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Driver Name:</span>
              <span className="value">{booking.vendorDetails?.driverName || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Driver Mobile:</span>
              <span className="value">{booking.vendorDetails?.driverMobile || "N/A"}</span>
            </div>
          </div>

          <div className="info-section">
            <h2>Pickup & Drop Details</h2>
            <div className="detail-row">
              <span className="label">Pickup Address:</span>
              <span className="value">{booking.pickupAddress}</span>
            </div>
            <div className="detail-row">
              <span className="label">Drop Address:</span>
              <span className="value">{booking.dropAddress}</span>
            </div>
            <div className="detail-row">
              <span className="label">Passengers:</span>
              <span className="value">{booking.passengers}</span>
            </div>
          </div>

          <div className="info-section">
            <h2>Price Details</h2>
            <div className="detail-row">
              <span className="label">Quoted Price:</span>
              <span className="value price">₹{booking.vendorDetails?.price || "N/A"}</span>
            </div>
            {booking.vendorDetails?.notes && (
              <div className="detail-row">
                <span className="label">Notes:</span>
                <span className="value">{booking.vendorDetails.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="download-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
        <button className="back-btn" onClick={() => navigate("/vendor/inbox")}>
          Back to Inbox
        </button>
      </div>
    </div>
  );
};

export default BookingInfo;