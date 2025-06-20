
import React from "react";
import "../styles/Dash.css"

const ProfilePage = () => {
  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="card">
          <img src="src/images/jaskaran.jpg" alt="Profile" />
          <h2>Jaskaran Singh</h2>
          <button className="button-outline">Share profile link</button>
          <p className="link">Update profile visibility</p>
        </div>

        <div className="card">
          <p className="info-text">
            Let recruiters know what role you’re looking for to make sure you find opportunities that are right for you.
          </p>
          <button className="button-primary">+ Add work preferences</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <section>
          <h2 className="section-title">Experience</h2>

          <div className="sub-card">
            <h3>Projects</h3>
            <p>
              Showcase your skills to recruiters with job-relevant projects. Add projects
              here to demonstrate your technical expertise and ability to solve real-world problems.
            </p>
            <p className="link">Browse Projects</p>
          </div>

          <div className="sub-card">
            <h3>Work history</h3>
            <p>
              Add your past work experience here. If you’re just starting out, you can
              add internships or volunteer experience instead.
            </p>
            <button className="button-primary">+ Add work experience</button>
          </div>
        </section>

        <section>
          <h2 className="section-title">Education</h2>

          <div className="sub-card">
            <h3>Credentials</h3>
            <p>
              Add your educational background here to let employers know where you studied or are currently studying.
            </p>
            <button className="button-primary">+ Add education</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
