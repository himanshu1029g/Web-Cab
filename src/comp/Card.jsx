import React from 'react';
import '../styles/Card.css';
// Import images
import chardhamImage from '../images/chardham.jpeg';
import wondersImage from '../images/wonders.jpg';


export default function Card() {
  const packages = [
    {
      id: 1,
      title: "Char dham yatra",
      image: chardhamImage,
      description: "Package Launch Char dham yatra"
    },
    {
      id: 2,
      title: "7 Wonders Package",
      image: wondersImage,
      description: "Taj Mahal, Golden Temple, Hampi, Sun Temple, Khajuraho"
    }
  ];

  return (
    <div className="packages-section">
      <h2 className="section-title">Popular Packages</h2>
      <div className="grid-container">
        {packages.map(pkg => (
          <div key={pkg.id} className="card">
            <div className="card-image">
              <img 
                src={pkg.image} 
                alt={pkg.title}
                loading="lazy"
              />
            </div>
            <div className="card-content">
              <h3>{pkg.title}</h3>
              <p>{pkg.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}