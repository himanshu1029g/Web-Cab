// FeedbackPage.jsx
import React from 'react';
import Feedback from '../comp/Feedback'; // Adjust path if needed
import Footer from '../comp/Footer';    // Adjust path if needed
import '../styles/Feedback.css';  // Feedback form styling
import '../styles/footer.css';    // Footer styling

const FeedbackPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <Feedback />
      </main>
      <Footer />
    </div>
  );
};

export default FeedbackPage;