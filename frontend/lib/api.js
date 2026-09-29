const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://help-bridge-backend-34vg.onrender.com/api";

/** @param {string} endpoint @param {RequestInit} [options] @param {string|null} [token] @returns {Promise<any>} */
export const apiRequest = async (endpoint, options = {}, token = null) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to HelpBridge. Please start the backend and try again.",
    );
  }

  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
