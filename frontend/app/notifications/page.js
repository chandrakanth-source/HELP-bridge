"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");

      await apiRequest(
        `/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
        token,
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first.");
          return;
        }

        const data = await apiRequest("/notifications", {}, token);

        setNotifications(data.notifications || []);
      } catch (error) {
        console.error(error);

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <div>
      <h1>Notifications</h1>
      <p>Unread notifications: {unreadCount}</p>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px",
              backgroundColor: notification.is_read ? "#ffffff" : "#f0f7ff",
            }}
          >
            <h3>{notification.title}</h3>

            <p>{notification.message}</p>

            <small>{notification.is_read ? "Read" : "Unread"}</small>

            {!notification.is_read && (
              <button onClick={() => markAsRead(notification.id)}>
                Mark as Read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

