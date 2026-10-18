const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://help-bridge-34vg.onrender.com/api";

export const getActiveToken = (explicitToken?: string | null): string | null => {
  if (typeof window === "undefined") return explicitToken || null;
  const match = window.location.pathname.match(/\/(user|manager|provider|admin)\/(\d+)/);
  if (match && match[2]) {
    const userToken = localStorage.getItem(`token_${match[2]}`);
    if (userToken) return userToken;
  }
  return explicitToken || localStorage.getItem("token");
};

export const getActiveUser = (): any => {
  if (typeof window === "undefined") return null;
  try {
    const match = window.location.pathname.match(/\/(user|manager|provider|admin)\/(\d+)/);
    if (match && match[2]) {
      const userObj = localStorage.getItem(`user_${match[2]}`);
      if (userObj) return JSON.parse(userObj);
    }
    const defaultUser = localStorage.getItem("user");
    return defaultUser ? JSON.parse(defaultUser) : null;
  } catch {
    return null;
  }
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}, token: string | null = null): Promise<any> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const effectiveToken = getActiveToken(token);
  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    if (typeof window !== "undefined" && window.location.hostname === "localhost" && API_URL !== "http://localhost:5000/api") {
      try {
        response = await fetch(`http://localhost:5000/api${endpoint}`, {
          ...options,
          headers,
        });
      } catch {
        throw new Error("Unable to connect to HelpBridge. Please start the backend and try again.");
      }
    } else {
      throw new Error("Unable to connect to HelpBridge. Please start the backend and try again.");
    }
  }

  const responseText = await response.text();
  let data: any = {};

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
