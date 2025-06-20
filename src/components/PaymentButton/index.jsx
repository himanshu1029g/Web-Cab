import { useState } from 'react';
import { getFirestore, addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import './styles.css';

const PaymentButton = ({ application, vendor, currentUser, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const db = getFirestore();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: application.price * 100, // Dynamic amount from vendor's quote
        currency: "INR",
        name: vendor.businessName || 'Vendor Service',
        description: `Booking Payment - ${application.bookingId}`,
        handler: async (response) => {
          try {
            // Create transaction record
            const transactionRef = await addDoc(collection(db, 'transactions'), {
              paymentId: response.razorpay_payment_id,
              vendorId: vendor.id,
              userId: currentUser.uid,
              applicationId: application.id,
              bookingId: application.bookingId,
              amount: application.price,
              status: 'success',
              timestamp: new Date()
            });

            // Update application with payment status
            await updateDoc(doc(db, 'applications', application.id), {
              paymentStatus: 'paid',
              transactionId: transactionRef.id
            });

            // Call onSuccess callback
            if (onSuccess) {
              await onSuccess();
            }
          } catch (error) {
            console.error('Payment error:', error);
          }
        },
        prefill: {
          name: currentUser?.displayName || '',
          email: currentUser?.email || '',
          // Phone number is optional in test mode
          contact: ''
        },
        notes: {
          bookingId: application.bookingId,
          vendorId: vendor.id
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="amount-display">
        Amount to Pay: ₹{application.price}
      </div>
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="payment-button"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};

export default PaymentButton;