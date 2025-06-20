// src/compo/SearchBar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SearchBar.css";
import { City, State } from "country-state-city";
import axios from "axios";
import arrow from "../images/arrow_pic.png";
import Loading from "./Loading";

const SearchBar = () => {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    pickupDate: new Date().toLocaleDateString("en-GB"), // Full date string (e.g., "08/04/2025")
    tripType: "one-way",
  });

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [filteredFromCities, setFilteredFromCities] = useState([]);
  const [filteredToCities, setFilteredToCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    console.log("Handling change for:", e.target.name, e.target.value); // Debug log
    if (e.target.name === "pickupDate") {
      const date = new Date(e.target.value); // e.target.value is ISO (e.g., "2025-04-17")
      if (!isNaN(date.getTime())) { // Ensure valid date
        const formattedDate = date.toLocaleDateString("en-GB"); // Full date (e.g., "17/04/2025")
        console.log("Formatted pickupDate:", formattedDate); // Debug log
        setFormData({ ...formData, pickupDate: formattedDate });
      } else {
        console.warn("Invalid date selected:", e.target.value);
        setFormData({ ...formData, pickupDate: new Date().toLocaleDateString("en-GB") }); // Reset to today
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Function to convert dd/MM/yyyy to ISO
  const formatToISO = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`).toISOString().split("T")[0];
  };

  useEffect(() => {
    if (fromSearch) {
      const results = City.getCitiesOfCountry("IN")
        .filter((city) =>
          city.name.toLowerCase().includes(fromSearch.toLowerCase())
        )
        .slice(0, 10);
      setFilteredFromCities(results);
    } else {
      setFilteredFromCities([]);
    }
  }, [fromSearch]);

  useEffect(() => {
    if (toSearch) {
      const results = City.getCitiesOfCountry("IN")
        .filter((city) =>
          city.name.toLowerCase().includes(toSearch.toLowerCase())
        )
        .slice(0, 10);
      setFilteredToCities(results);
    } else {
      setFilteredToCities([]);
    }
  }, [toSearch]);

  const getCoordinates = async (place) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${place}`;
      const response = await axios.get(url);
      if (response.data.length > 0) {
        return { lat: response.data[0].lat, lon: response.data[0].lon };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  const getDistanceOSRM = async (from, to) => {
    const fromCoords = await getCoordinates(from);
    const toCoords = await getCoordinates(to);

    if (!fromCoords || !toCoords) {
      alert("Invalid city names or coordinates not found.");
      return;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false`;

    try {
      const response = await axios.get(url, { timeout: 10000 });
      if (response.data.routes.length > 0) {
        const distanceKm = response.data.routes[0].distance / 1000;
        const durationSec = response.data.routes[0].duration;

        const hours = Math.floor(durationSec / 3600);
        const minutes = Math.floor((durationSec % 3600) / 60);

        const tripMultiplier = formData.tripType === "round-trip" ? 2 : 1;
        const finalDistance = distanceKm * tripMultiplier;
        const totalTime = `${hours * tripMultiplier}h ${minutes * tripMultiplier}m`;

        setDistance(finalDistance);

        const selectedFromCity = fromSearch;
        const selectedToCity = toSearch;
        const selectedFromState = State.getStateByCodeAndCountry(fromCoords.stateCode, "IN")?.name;
        const selectedToState = State.getStateByCodeAndCountry(toCoords.stateCode, "IN")?.name;
        const fullPickupAddress = `${fromSearch}, ${selectedFromState}`;
        const fullDropAddress = `${toSearch}, ${selectedToState}`;

        navigate("/car-selection", {
          state: {
            routeDetails: {
              from: selectedFromCity,
              to: selectedToCity,
              fromState: selectedFromState, // e.g. "Punjab"
              toState: selectedToState,     // e.g. "Haryana"
              fromAddress: fullPickupAddress,
              toAddress: fullDropAddress,
              pickupDate: formData.pickupDate,
              tripType: formData.tripType,
              distance: finalDistance,
              totalTime: totalTime,
            },
            carDetails: {},
          },
        });
      } else {
        alert("No route found between the selected cities.");
      }
    } catch (error) {
      console.error("Error fetching distance:", error);
      alert("Failed to fetch route. Please try again later.");
    }
  };

  const handleCityClick = (cityName, type) => {
    if (type === "from") {
      setFromSearch(cityName);
      setFormData({ ...formData, from: cityName });
      setFilteredFromCities([]);
    } else {
      setToSearch(cityName);
      setFormData({ ...formData, to: cityName });
      setFilteredToCities([]);
    }
  };

  const handleExploreClick = async (e) => {
    e.preventDefault();
    if (!fromSearch || !toSearch) {
      alert("Please select both 'From' and 'To' cities");
      return;
    }
    if (fromSearch === toSearch) {
      alert("Pickup and drop locations cannot be the same");
      return;
    }

    setLoading(true);
    try {
      await getDistanceOSRM(fromSearch, toSearch);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      {loading ? (
        <Loading />
      ) : (
        <>
          <h2 className="search-title">SERVICES ACROSS 500+ CITIES</h2>
          <div className="search-box">
            <div className="trip-type">
              <button
                className={formData.tripType === "one-way" ? "active" : ""}
                onClick={() =>
                  setFormData({ ...formData, tripType: "one-way" })
                }
              >
                ONE WAY
              </button>
              <button
                className={formData.tripType === "round-trip" ? "active" : ""}
                onClick={() =>
                  setFormData({ ...formData, tripType: "round-trip" })
                }
              >
                ROUND TRIP
              </button>
            </div>

            <div className="search-fields">
              <div className="input-group">
                <label>FROM</label>
                <input
                  type="text"
                  placeholder="Enter Pickup City"
                  value={fromSearch}
                  onChange={(e) => setFromSearch(e.target.value)}
                />
                {filteredFromCities.length > 0 && (
                  <ul className="suggestions">
                    {filteredFromCities.map((city, index) => (
                      <li
                        key={index}
                        onClick={() => handleCityClick(city.name, "from")}
                      >
                        {city.name},{" "}
                        {
                          State.getStateByCodeAndCountry(city.stateCode, "IN")
                            ?.name
                        }
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <img src={arrow} className="arrow-img" alt="arrow" />

              <div className="input-group">
                <label>TO</label>
                <input
                  type="text"
                  placeholder="Enter Drop City"
                  value={toSearch}
                  onChange={(e) => setToSearch(e.target.value)}
                />
                {filteredToCities.length > 0 && (
                  <ul className="suggestions">
                    {filteredToCities.map((city, index) => (
                      <li
                        key={index}
                        onClick={() => handleCityClick(city.name, "to")}
                      >
                        {city.name},{" "}
                        {
                          State.getStateByCodeAndCountry(city.stateCode, "IN")
                            ?.name
                        }
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="input-group">
                <label>PICK UP DATE</label>
                <input
                  type="date"
                  name="pickupDate"
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.pickupDate ? formatToISO(formData.pickupDate) : new Date().toISOString().split("T")[0]} // Use custom ISO conversion
                />
              </div>
            </div>

            <button
              className="search-btn"
              onClick={handleExploreClick}
              disabled={loading || !fromSearch || !toSearch}
            >
              {loading ? "Calculating..." : "EXPLORE CARS"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchBar;