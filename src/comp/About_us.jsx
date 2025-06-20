import React from 'react';
import "../styles/About_us.css";

export default function About_us() {
  return (
    <div className="about-container">
      <h1 className="about-title">Contact Us</h1>
      <div className="about-card">
       <h2 className="about-text">Our Team</h2>
        <p className="about-description">
          The WebCab team is here to help you. Our goal is to provide easy and functional rides to our users.
          If you have any concerns about our work then you can contact the following members.
        </p>
        <p className="about-description">
          <strong>Mr. Jaskaran Singh</strong> is there to provide you with the best Customer Support that you have ever experienced.
          He is our HOCR (Head of Customer Relations) and possesses 5 years of experience in the said field.
        </p>
        <p className="about-description">
          If any technical problems occur, please contact <strong>Mr. Himanshu Gupta</strong>. He is our Senior Engineer and has been the backbone of our enterprise for almost 7 years.
        </p>
        <p className="about-description">
          For general inquiries, contact our chairman <strong>Mr. Karan Bangar</strong>. He will respond to all your questions and only he can provide you with the best solutions,
          since he was the one who laid the foundation of this historic, credible, undisputed, and most reliable transport website in the world.
        </p>
      </div>
    </div>
  );
}
