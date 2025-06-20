import React, { useState, useEffect } from "react";
import "../styles/Inbox.css";

const Inbox = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false); // State to track inbox visibility

    useEffect(() => {
        // Mock data for unread notifications
        const mockNotifications = [
            {
                id: 1,
                userName: "John Doe",
                pickupAddress: "123 Main St, City Center",
                destination: "456 Elm St, Downtown",
                stops: 2,
                Date: "15th October 2025",
                pickupTime: "10:30 AM"
            },
            {
                id: 2,
                userName: "Alice Smith",
                pickupAddress: "789 Oak St, Suburbs",
                destination: "101 Pine St, Uptown",
                stops: 1,
                Date: "25th April 2025",
                pickupTime: "12:00 PM"
            }
        ];
        
        setNotifications(mockNotifications);
    }, []);

    const handleAccept = (id) => {
        alert(`Ride accepted for notification ID: ${id}`);
    };

    const handleCancel = (id) => {
        alert(`Ride cancelled for notification ID: ${id}`);
    };

    return (
        <div className="inbox-wrapper">
            {/* Clickable header to toggle inbox */}
            <div className="inbox-header" onClick={() => setIsOpen(!isOpen)}>
                <h2>Inbox {isOpen ? "▲" : "▼"}</h2>
            </div>

            {isOpen && (
                <div className="inbox-container">
                    {notifications.length === 0 ? (
                        <p>No new notifications</p>
                    ) : (
                        <ul className="notification-list">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="notification-item">
                                    <div className="notification-content">
                                        <div className="notification-details">
                                            <h3>{notification.userName}</h3>
                                            <p><strong>Pickup Address:</strong> {notification.pickupAddress}</p>
                                            <p><strong>Destination:</strong> {notification.destination}</p>
                                            <p><strong>Number of Stops:</strong> {notification.stops}</p>
                                            <p><strong>Pickup Time:</strong> {notification.pickupTime}</p>
                                            <p><strong>Date:</strong> {notification.Date}</p>
                                        </div>
                                        <div className="notification-actions">
                                            <button className="accept-btn" onClick={() => handleAccept(notification.id)}>
                                                ✅ Accept
                                            </button>
                                            <button className="cancel-btn" onClick={() => handleCancel(notification.id)}>
                                                ❌ Cancel Ride
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default Inbox;
