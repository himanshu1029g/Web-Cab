// src/comp/CarDetail_Card.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CarDetail_Card.css";

function CarDetail_Card({
  car_pic,
  car_name,
  baseFare = 1000,
  perKmRate = 10,
  distance = 0,
  time = "0h 0m",
  from,
  to,
  pickupDate,
  tripType,
  routeDetails, // <-- add this
}) {
  const [activeTab, setActiveTab] = useState("INCLUSIONS");
  const [showDetails, setShowDetails] = useState(false);
  const [finalPrice, setFinalPrice] = useState(baseFare);
  const navigate = useNavigate();

  useEffect(() => {
    const totalPrice = baseFare + distance * perKmRate;
    setFinalPrice(totalPrice);
  }, [distance, baseFare, perKmRate]);

  const handleTabClick = (tab) => setActiveTab(tab);
  const toggleDetails = () => setShowDetails(!showDetails);

  const handleSelectClick = () => {
    const carDetails = {
      image: car_pic,
      name: car_name,
      baseFare,
      perKmRate,
      distance,
      time,
      finalPrice,
    };
    navigate("/booking", {
      state: {
        carDetails,
        routeDetails: {
          from,
          to,
          pickupDate,
          tripType,
          distance,
          time,
        },
      },
    });
  };

  return (
    <div className="card-container">
      <div className="card-header">
        <img src={car_pic} alt={car_name} className="car-image" />
        <div className="car-info">
          <h3>{car_name}</h3>
          <p>or equivalent</p>
        </div>
        <div className="details-section">
          <p>{distance} KM</p>
          <p>{time} approx</p>
        </div>
        <div className="price-section">
          <p className="final-price">₹{finalPrice.toFixed(0)}</p>
          <button className="select-btn" onClick={handleSelectClick}>
            Select
          </button>
        </div>
      </div>

      <button className="details-btn" onClick={toggleDetails}>
        {showDetails ? "Hide Details" : "Details"}
      </button>

      {showDetails && (
        <div className="collapsible-section">
          <div className="tabs">
            {["INCLUSIONS", "EXCLUSIONS", "FACILITIES", "T&C"].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === "INCLUSIONS" && (
              <div>
                <p>Base Fare for {distance} km</p>
                <p>✅ Driver Allowance</p>
                <p>✅ State Tax & Toll</p>
                <p>✅ GST (5%)</p>
              </div>
            )}
            {activeTab === "EXCLUSIONS" && (
              <div>
                <p>❌ Additional distance fare</p>
                <p>❌ Night charges (if applicable)</p>
              </div>
            )}
            {activeTab === "FACILITIES" && (
              <div>
                <p>💡 AC available</p>
                <p>🚗 Clean and Sanitized Cars</p>
              </div>
            )}
            {activeTab === "T&C" && (
              <div>
                <p>⚠️ Refund on cancellation within 24 hours</p>
                <p>⚠️ GST applicable as per Govt. rules</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetail_Card;