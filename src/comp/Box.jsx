import React from "react";
import "../styles/Box.css";
import Dp from "../images/roundtrip-desktop.webp";
import Round from "../images/one-ways-desktop.webp";
import Local from "../images/local-desktop.webp";
import Airport from "../images/airport-desktop.webp";

function Box() {
    return (
        <>
            <div className="grid-container">
            <div className="card">
                <img id="Dp" src={Dp} alt="Roundtrip Cabs"></img>
                <h4>Roundtrip Cabs</h4>
                <p>
                Our premium roundtrip services will pamper you with an absolutely
                comfortable drive from your doorstep & back. Our chauffeurs are not
                only courteous but are also expert travel companions that will make
                your road travel memorable. Affordable Luxury, as we’d like to call
                it.
                </p>
            </div>
            <div className="card">
                <img id="Local" src={Local} alt="Local Rentals"></img>
                <h4>Local Rentals</h4>
                <p>
                Book our flexible hourly rental cabs and get chauffeured within the
                city for your business meetings or shopping chores. Our local
                rentals are available for 4 hours, 8 hours or 12 hours, based on
                your needs. Explore your city like a local.
                </p>
            </div>
            <div className="card">
                <img id="Round" src={Round} alt="Oneway Drops"></img>
                <h4>Oneway Drops</h4>
                <p>
                Our network of over 15 lakh one way routes ensures that there is no
                corner of the country that you can’t travel with us. Pay only one
                side charge at rock bottom rates. If you need to be somewhere, we’ll
                get you there
                </p>
            </div>
            <div className="card">
                <img id="Airport" src={Airport} alt="Airport Transfers"></img>
                <h4>Airport Transfers</h4>
                <p>
                We care about your flight as much as you do. Our airport transfer
                services across airports in the country offer pickups and drops with
                complete reliability. Book in advance and rest easy - we will take
                care of the rest.
                </p>
            </div>
            </div>
        </>
        );
}

export default Box;