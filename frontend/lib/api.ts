const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://help-bridge-34vg.onrender.com/api";

export const getActiveToken = (explicitToken?: string | null): string | null => {
  if (typeof window === "undefined") return explicitToken || null;
  const match = window.location.pathname.match(/\/(user|manager|provider|admin)\/(\d+)/);
  if (match && match[2]) {
    const userToken =
      sessionStorage.getItem(`token_${match[2]}`) ||
      localStorage.getItem(`token_${match[2]}`);
    if (userToken) return userToken;
  }
  return (
    explicitToken ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
};

export const getActiveUser = (): any => {
  if (typeof window === "undefined") return null;
  try {
    const match = window.location.pathname.match(/\/(user|manager|provider|admin)\/(\d+)/);
    if (match && match[2]) {
      const userObj =
        sessionStorage.getItem(`user_${match[2]}`) ||
        localStorage.getItem(`user_${match[2]}`);
      if (userObj) return JSON.parse(userObj);
    }
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) return JSON.parse(sessionUser);
    const defaultUser = localStorage.getItem("user");
    return defaultUser ? JSON.parse(defaultUser) : null;
  } catch {
    return null;
  }
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}, token: string | null = null): Promise<any> => {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

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
