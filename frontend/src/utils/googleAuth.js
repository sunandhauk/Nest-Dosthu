const GOOGLE_CALLBACK_PATH = "/auth/google/callback";
const DEFAULT_PRODUCTION_API_URL = "https://nest-dosthu.onrender.com";

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return process.env.REACT_APP_API_URL || "http://localhost:8000";
};

export const getGoogleRedirectUri = () => {
  const configuredRedirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;

  if (typeof window === "undefined") {
    return configuredRedirectUri || `http://localhost:3000${GOOGLE_CALLBACK_PATH}`;
  }

  // Prefer the explicitly configured redirect URI when present so the frontend,
  // backend, and Google Console all use the exact same callback URL.
  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  return `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;
};

export const startGoogleAuth = ({ role } = {}) => {
  const params = new URLSearchParams({
    role: role === "host" ? "host" : "user",
    frontend_redirect: getGoogleRedirectUri(),
  });

  window.location.href = `${getApiBaseUrl()}/auth/google?${params.toString()}`;
};

export const validateGoogleAuthState = () => true;
export const consumeGoogleAuthRole = () => "user";
