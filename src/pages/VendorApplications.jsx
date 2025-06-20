import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PaymentButton from '../components/PaymentButton';
import { useAuth } from '../context/AuthContext';

const VendorApplications = () => {
  const [applications, setApplications] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const apps = [];
      
      for (const doc of snapshot.docs) {
        const application = { id: doc.id, ...doc.data() };
        // Fetch vendor details for each application
        const vendorDoc = await getDoc(doc(db, 'vendors', application.vendorId));
        apps.push({
          ...application,
          vendor: { id: vendorDoc.id, ...vendorDoc.data() }
        });
      }
      
      setApplications(apps);
    };

    fetchApplications();
  }, [currentUser]);

  return (
    <div className="applications-container">
      <h1>My Applications</h1>
      {applications.map(app => (
        <div key={app.id} className="application-card">
          <h2>{app.vendor.businessName}</h2>
          <p>Status: {app.status}</p>
          <p>Amount: ₹{app.amount}</p>
          
          {app.status === 'approved' && !app.transactionId && (
            <PaymentButton
              application={app}
              vendor={app.vendor}
              currentUser={currentUser}
            />
          )}
          
          {app.transactionId && (
            <p className="success-text">Payment Completed</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default VendorApplications;