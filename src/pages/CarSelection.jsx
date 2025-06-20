// src/pages/CarSelection.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/CarSelection.css";
import CarDetail_Card from "../comp/CarDetail_Card";

import wagonr from "../images/vehicles/wagonr.jpeg";
import brezza from "../images/vehicles/brezza.jpeg";
import Scorpio from "../images/vehicles/scorpio.png";
import Bus from "../images/vehicles/bus.png";
import Tempu_traveller from "../images/vehicles/tempu_traveller.png";

function CarSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { routeDetails = {} } = location.state || {};

  const carOptions = [
    { car_pic: wagonr, car_name: "Wagon R", baseFare: 1800, perKmRate: 10 },
    { car_pic: brezza, car_name: "Brezza Dzire", baseFare: 1900, perKmRate: 11 },
    { car_pic: Scorpio, car_name: "Scorpio", baseFare: 2400, perKmRate: 12 },
    { car_pic: Tempu_traveller, car_name: "Force Traveller", baseFare: 3000, perKmRate: 13 },
    { car_pic: Bus, car_name: "Bus", baseFare: 4000, perKmRate: 15 },
  ];

  const handleSelectCar = (car, price) => {
    navigate("/booking", {
      state: {
        routeDetails,
        carDetails: {
          ...car,
          finalPrice: price,
        },
      },
    });
  };

  return (
    <div className="selection-container">
      <h2>Select Your Car</h2>
      <div className="car-list">
        {carOptions.map((car, index) => (
          <div className="car-card" key={index}>
            <CarDetail_Card
              car_pic={car.car_pic}
              car_name={car.car_name}
              baseFare={car.baseFare}
              perKmRate={car.perKmRate}
              distance={routeDetails.distance}
              time={routeDetails.totalTime}
              from={routeDetails.from}
              to={routeDetails.to}
              pickupDate={routeDetails.pickupDate}
              tripType={routeDetails.tripType}
              routeDetails={routeDetails} // pass all route details
              onSelectCar={handleSelectCar}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CarSelection;