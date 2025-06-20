import React from "react";
import "../styles/OurDetail.css";
import { FaEnvelope, FaLinkedin, FaGithub } from "react-icons/fa6";

const OurDetail = () => {
  const contacts = [
    { 
      name: "Jaskaran Singh", 
      role: "Customer Support", 
      image: "src/images/jaskaran.jpg", 
      email: "mr.jaskaran.in@gmail.com",
      linkdin: "https://www.linkedin.com/in/myprofile", 
      github: "https://github.com/JaskaranSanghwal",
      mobile: "8146215138"
    },
    { 
      name: "Himanshu Gupta", 
      role: "Technical Support", 
      image: "src/images/himanshu.jpg", 
      email: "ft.himanshu10@gmail.com",
      linkdin: "http://www.linkedin.com/in/himanshu-gupta-ba9573359", 
      github: "https://github.com/himanshu1029g",
      mobile: "962716122"
    },
    { 
      name: "Karan Bangar", 
      role: "General Inquiry", 
      image: "/src/images/IMG-20240909-WA0013.jpg", 
      email: "karanbangar255@gmail.com",
      linkdin: "https://www.linkedin.com/in/myprofile", 
      github: "https://github.com/TomHArdy22311",
      mobile: "98144425968" 
    },
  ];

  return (
    <div className="contact-container">
      <div className="contact-boxes">
        {contacts.map((contact, index) => (
          <div className="contact-card" key={index}>
            <div className="profile-pic">
              <img src={contact.image} alt={contact.name} />
            </div>
            <h3>{contact.name}</h3>
            <p>{contact.role}</p>

            {/* Clickable Email Icon */}
            <a href={`mailto:${contact.email}`} target="_blank" rel="noopener noreferrer">
              <FaEnvelope size={22} color="red" style={{ marginRight: "8px" }} />
            </a>
            <p>{contact.email}</p>

            {/* Clickable LinkedIn Icon */}
            <a href={contact.linkdin} target="_blank" rel="noopener noreferrer">
              <FaLinkedin size={30} color="blue" style={{ marginRight: "8px" }} />
            </a>

            {/* Clickable GitHub Icon */}
            <a href={contact.github} target="_blank" rel="noopener noreferrer">
              <FaGithub size={30} color="black" />
            </a>

            <p>+91 {contact.mobile}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurDetail;
