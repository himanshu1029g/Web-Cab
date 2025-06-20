// "use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import "../styles/Ticket.css"
import { app } from "../firebase"

export default function Ticket() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const auth = getAuth(app)
  const db = getFirestore(app)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)
  const [transaction, setTransaction] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user role
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (!userDoc.exists() || userDoc.data().role !== "user") {
            setError("Only users can view tickets")
            navigate("/vendor/inbox")
            return
          }

          // Fetch booking details
          const bookingDoc = await getDoc(doc(db, "bookings", bookingId))
          if (!bookingDoc.exists()) {
            setError("Booking not found")
            setLoading(false)
            return
          }

          const bookingData = {
            id: bookingDoc.id,
            ...bookingDoc.data(),
          }

          // Fetch application with matching bookingId
          let vendorDetails = null
          const appsQuery = query(
            collection(db, "applications"),
            where("bookingId", "==", bookingId)
          )
          const appsSnap = await getDocs(appsQuery)
          if (!appsSnap.empty) {
            const appData = appsSnap.docs[0].data()
            // Merge root fields and vendorDetails (root fields take priority)
            vendorDetails = {
              driverName: appData.driverName || appData.vendorDetails?.name || "Not Assigned",
              companyName: appData.companyName || "Not Assigned",
              carNumber: appData.carNumber || "Not Assigned",
              driverMobile: appData.driverMobile || "Not Assigned",
              companyMobile: appData.companyMobile || "Not Assigned",
              email: appData.email || appData.vendorDetails?.email || "Not Assigned",
            }
          }
          bookingData.vendorDetails = vendorDetails

          // Check if user is authorized to view this ticket
          if (bookingData.userId !== user.uid) {
            setError("You are not authorized to view this ticket")
            setLoading(false)
            return
          }

          setBooking(bookingData)

          // Fetch transaction details if available
          if (bookingData.transactionId) {
            const transactionDoc = await getDoc(doc(db, "transactions", bookingData.transactionId))
            if (transactionDoc.exists()) {
              setTransaction({
                id: transactionDoc.id,
                ...transactionDoc.data(),
                createdAt: transactionDoc.data().createdAt?.toDate() || new Date(),
              })
            }
          }
        } catch (err) {
          console.error("Error fetching ticket details:", err)
          setError("Error fetching ticket details: " + err.message)
        } finally {
          setLoading(false)
        }
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [auth, db, bookingId, navigate])

  const downloadPDF = async () => {
    try {
      const input = document.getElementById("ticket")
      if (!input) {
        console.error("Ticket element not found")
        return
      }

      // Create a temporary container to ensure full content capture
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = input.offsetWidth + "px"
      tempContainer.style.padding = "20px"
      tempContainer.style.background = "#fff"
      tempContainer.innerHTML = input.innerHTML
      document.body.appendChild(tempContainer)

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: tempContainer.scrollWidth,
        windowHeight: tempContainer.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calculate image dimensions in PDF
      const imgProps = pdf.getImageProperties(imgData)
      const imgWidth = pdfWidth
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Add more pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`Cab_Ticket_${bookingId.substring(0, 6)}.pdf`)

      // Clean up
      document.body.removeChild(tempContainer)
    } catch (err) {
      console.error("Error generating PDF:", err)
      alert("Failed to generate PDF: " + err.message)
    }
  }

  function formatDate(date) {
    if (!date) return "N/A"
    // If Firestore Timestamp
    if (date.toDate) {
      date = date.toDate()
    }
    // If string, try to parse
    if (typeof date === "string") {
      // Try to parse as ISO or DD/MM/YYYY
      const parts = date.split("/")
      if (parts.length === 3) {
        // DD/MM/YYYY
        date = new Date(parts[2], parts[1] - 1, parts[0])
      } else {
        // Try Date constructor
        date = new Date(date)
      }
    }
    if (date instanceof Date && !isNaN(date)) {
      return date.toLocaleDateString()
    }
    return "Invalid date"
  }

  const formatTime = (timeString) => {
    if (!timeString) return "N/A"
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    } catch (e) {
      return timeString
    }
  }

  if (loading) return <div className="loading">Loading ticket...</div>
  if (error) return <div className="error">{error}</div>
  if (!booking) return <div className="error">Booking not found</div>

  return (
    <div className="ticket-wrapper">
      <div className="ticket-actions">
        <button className="back-button" onClick={() => navigate("/user/inbox")}>
          ← Back to Inbox
        </button>
        <button className="download-btn" onClick={downloadPDF}>
          📄 Download PDF
        </button>
      </div>

      <div id="ticket" className="ticket-container">
        <h2 className="status">✅ STATUS: {booking.status?.toUpperCase() || "N/A"}</h2>
        <p className="sub-heading">
          {booking.passengers || "1"} Passenger(s) | {booking.tripType || "One Way"}
        </p>

        <div className="ticket-section">
          <h3>🚗 Cab Information</h3>
          <table>
            <tbody>
              <tr>
                <td>Driver</td>
                <td>{booking.vendorDetails?.driverName || "Not Assigned"}</td>
              </tr>
              <tr>
                <td>Company</td>
                <td>{booking.vendorDetails?.companyName || "Not Assigned"}</td>
              </tr>
              <tr>
                <td>Car No.</td>
                <td>{booking.vendorDetails?.carNumber || "Not Assigned"}</td>
              </tr>
              <tr>
                <td>Driver Contact</td>
                <td>{booking.vendorDetails?.driverMobile || "Not Assigned"}</td>
              </tr>
              <tr>
                <td>Company Contact</td>
                <td>{booking.vendorDetails?.companyMobile || "Not Assigned"}</td>
              </tr>
              <tr>
                <td>Company Email</td>
                <td>{booking.vendorDetails?.email || "Not Assigned"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-section">
          <h3>🧍 Passenger Information</h3>
          <table>
            <tbody>
              <tr>
                <td>Name</td>
                <td>{booking.names || "Not Specified"}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>{booking.email || "Not Specified"}</td>
              </tr>
              <tr>
                <td>Mobile</td>
                <td>{booking.mobile || "Not Specified"}</td>
              </tr>
              <tr>
                <td>Passengers</td>
                <td>{booking.passengers || "1"}</td>
              </tr>
              <tr>
                <td>Purpose</td>
                <td>{booking.purpose || "Not Specified"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ticket-section">
          <h3>🗓️ Booking Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Booking ID</td>
                <td>{booking.id.substring(0, 8)}</td>
              </tr>
              <tr>
                <td>From</td>
                <td>{booking.from || "N/A"}</td>
              </tr>
              <tr>
                <td>To</td>
                <td>{booking.to || "N/A"}</td>
              </tr>
              <tr>
                <td>Pickup Address</td>
                <td>{booking.pickupAddress || "N/A"}</td>
              </tr>
              <tr>
                <td>Drop Address</td>
                <td>{booking.dropAddress || "N/A"}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td>{formatDate(booking.date)}</td>
              </tr>
              <tr>
                <td>Time</td>
                <td>{formatTime(booking.pickupTime)}</td>
              </tr>
              <tr>
                <td>Stops</td>
                <td>{booking.stops || "None"}</td>
              </tr>
              {booking.stopAddresses && (
                <tr>
                  <td>Stop Addresses</td>
                  <td>{booking.stopAddresses || "None"}</td>
                </tr>
              )}
              <tr>
                <td>Vehicle Type</td>
                <td>{booking.carDetails?.name || "Not Specified"}</td>
              </tr>
              <tr>
                <td>Booked On</td>
                <td>{formatDate(booking.createdAt)}</td>
              </tr>
              {booking.notes && (
                <tr>
                  <td>Vendor Notes</td>
                  <td>{booking.notes || "None"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ticket-section">
          <h3>💳 Payment Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Payment Mode</td>
                <td>{transaction?.paymentMode || "Cash"}</td>
              </tr>
              <tr>
                <td>Total Amount</td>
                <td>₹{booking.price || "To be determined"}</td>
              </tr>
              <tr>
                <td>Amount Paid</td>
                <td>₹{transaction?.amountPaid || "0"}</td>
              </tr>
              <tr>
                <td>Remaining Amount</td>
                <td>
                  ₹{booking.price ? (booking.price - (transaction?.amountPaid || 0)) : "To be determined"}
                </td>
              </tr>
              <tr>
                <td>Payment Status</td>
                <td>{transaction?.status?.toUpperCase() || "Pending"}</td>
              </tr>
              {transaction?.id && (
                <tr>
                  <td>Transaction ID</td>
                  <td>{transaction.id.substring(0, 8)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ticket-footer">
          <p>Thank you for choosing our service!</p>
          <p>For any assistance, please contact customer support.</p>
        </div>
      </div>
    </div>
  )
}