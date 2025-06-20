import React from 'react';
import '../styles/Grid.css';

export default function Grid() {
  const services = [
    {
      id: 1,
      title: "24/7 Support",
      icon: "🚗",
      description: "Round the clock customer support"
    },
    {
      id: 2,
      title: "Secure Booking",
      icon: "🔒",
      description: "Safe and secure payment process"
    },
    {
      id: 3,
      title: "Expert Drivers",
      icon: "👨‍✈️",
      description: "Professional and experienced drivers"
    }
  ];

  return (
    <div className="services-section">
      <h2 className="section-title">Services Detail</h2>
      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}