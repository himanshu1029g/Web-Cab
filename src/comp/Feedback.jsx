// Feedback.jsx
import React, { useState } from 'react';
import '../styles/Feedback.css';
import axios from 'axios';

const Feedback = (e) => {
  const [feedback, setFeedback] = useState('');
  const [experience, setExperience] = useState('');


  const handleSubmit = async () => {
    try {
      // Simulate a successful response
      console.log('Submitting feedback:', { feedback, experience });
      const mockResponse = { data: { message: 'Feedback received!' } };
      console.log('Server Response:', mockResponse.data);
      alert('Thank you for your feedback!');

      setFeedback(" ");
      setExperience("");
    } catch (error) {
      console.error('Detailed Error:', error);
      alert('Something went wrong. Please try again later.');
    }
  
  };
  return (
    <div className="feedback-container">
      <h1>Give Us Your Feedback</h1>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write your feedback here..."
      ></textarea>

      <div className="emoji-rating">
        {[
          { value: 'excellent', emoji: '😄', label: 'Excellent' },
          { value: 'best', emoji: '😊', label: 'Best' },
          { value: 'good', emoji: '🙂', label: 'Good' },
          { value: 'poor', emoji: '😕', label: 'Poor' },
          { value: 'very poor', emoji: '😠', label: 'Very Poor' },
        ].map(({ value, emoji, label }) => (
          <label key={value}>
            <input
              type="radio"
              name="experience"
              value={value}
              checked={experience === value}
              onChange={() => setExperience(value)}
              hidden
            />
            <span
              className="emoji"
              title={label}
              onClick={() => {
                setExperience(value);
                setFeedback((prev) => prev + ' ' + emoji);
              }}
              style={{ cursor: 'pointer' }}
            >
              {emoji}
            </span>
          </label>
        ))}
      </div>

      <button type="button" onClick={handleSubmit}>Submit Feedback</button>
    </div>
  );
};

export default Feedback;