import React from "react";
import "../styles/footer.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
faInstagram,
faFacebook,
faTwitter,
faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
return (
<footer>
    <div className="footer">
    <div className="footer-column">
        <h4>COMPANY</h4>
        <ul>
        <li>
            <a href="#">About Us</a>
        </li>
        <li>
            <a href="#">Media Coverage</a>
        </li>
        <li>
            <a href="#">Privacy Policy</a>
        </li>
        <li>
            <a href="#">Terms & Conditions</a>
        </li>
        <li>
            <a href="#">Refunds</a>
        </li>
        </ul>
    </div>
    <div className="footer-column">
        <h4>SERVICES</h4>
        <ul>
        <li>
            <a href="#">Local Car Rentals</a>
        </li>
        <li>
            <a href="#">Outstation Taxi</a>
        </li>
        <li>
            <a href="#">One way cabs</a>
        </li>
        <li>
            <a href="#">Corporate Car Rental</a>
        </li>
        <li>
            <a href="#">Tempo Travellers and Minibuses</a>
        </li>
        </ul>
    </div>
    <div className="footer-column">
        <h4>GET IN TOUCH</h4>
        <ul>
        <li>
            <a href="#">Contact Us</a>
        </li>
        <li>
            <a href="#">Travel Agent</a>
        </li>
        </ul>
        <div className="social-icons">
        <a href="#">
            <FontAwesomeIcon icon={faInstagram} />
        </a>
        <a href="#">
            <FontAwesomeIcon icon={faFacebook} />
        </a>
        <a href="#">
            <FontAwesomeIcon icon={faTwitter} />
        </a>
        <a href="#">
            <FontAwesomeIcon icon={faYoutube} />
        </a>
        </div>
    </div>
    </div>
    <div className="footer-bottom">© Copyright WebCab.com</div>
</footer>
);
};

export default Footer;
