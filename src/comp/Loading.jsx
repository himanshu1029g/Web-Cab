import React from "react";
import "../styles/Loading.css";
import logo from "../images/Logo.jpg";

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="logo-wrapper">
          <img src={logo} alt="Logo" className="loading-logo" />
          <div className="loading-spinner"></div>
        </div>
        <div className="loading-text">
          <span>L</span>
          <span>o</span>
          <span>a</span>
          <span>d</span>
          <span>i</span>
          <span>n</span>
          <span>g</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
