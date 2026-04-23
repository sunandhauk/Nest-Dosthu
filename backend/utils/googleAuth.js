const axios = require("axios");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_CALLBACK_PATH = "/auth/google/callback";
const FRONTEND_GOOGLE_CALLBACK_PATH = "/auth/google/callback";
const DEFAULT_PRODUCTION_BACKEND_URL = "https://nest-dosthu.onrender.com";
const DEFAULT_PRODUCTION_FRONTEND_URL = "https://nest-dosthu.netlify.app";

const normalizeRedirectUri = (value, expectedPath = GOOGLE_CALLBACK_PATH) => {
  if (!value) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.pathname !== expectedPath) {
      return null;
    }

    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch (error) {
    return null;
  }
};

const normalizeFrontendRedirectUri = (value) =>
  normalizeRedirectUri(value, FRONTEND_GOOGLE_CALLBACK_PATH);

const isAllowedFrontendOrigin = (origin) => {
  try {
    const parsedUrl = new URL(origin);

    if (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.endsWith(".netlify.app")
    ) {
      return true;
    }

    const configuredFrontendUrl = process.env.FRONTEND_URL;

    if (configuredFrontendUrl) {
      const configuredOrigin = new URL(configuredFrontendUrl).origin;
      return configuredOrigin === parsedUrl.origin;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const resolveBackendBaseUrl = (req) => {
  const configuredBaseUrl =
    process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  if (req) {
    return `${req.protocol}://${req.get("host")}`;
  }

  return DEFAULT_PRODUCTION_BACKEND_URL;
};

const getGoogleCallbackUrl = (req) =>
  `${resolveBackendBaseUrl(req)}${GOOGLE_CALLBACK_PATH}`;

const getConfiguredRedirectUris = () => {
  const configuredUris = new Set();
  const envRedirectUri = normalizeRedirectUri(process.env.GOOGLE_REDIRECT_URI);
  const allowedRedirectUris = (process.env.GOOGLE_ALLOWED_REDIRECT_URIS || "")
    .split(",")
    .map((value) => normalizeRedirectUri(value.trim()))
    .filter(Boolean);

  if (envRedirectUri) {
    configuredUris.add(envRedirectUri);
  }

  allowedRedirectUris.forEach((value) => configuredUris.add(value));

  return configuredUris;
};

const validateFrontendRedirectUri = (redirectUri) => {
  const normalizedRedirectUri = normalizeFrontendRedirectUri(redirectUri);

  if (!normalizedRedirectUri) {
    return null;
  }

  const redirectOrigin = new URL(normalizedRedirectUri).origin;

  if (isAllowedFrontendOrigin(redirectOrigin)) {
    return normalizedRedirectUri;
  }

  return null;
};

const resolveFrontendRedirectUri = (redirectUri) => {
  const validatedRedirectUri = validateFrontendRedirectUri(redirectUri);

  if (validatedRedirectUri) {
    return validatedRedirectUri;
  }

  const configuredFrontendUrl = process.env.FRONTEND_URL;

  if (configuredFrontendUrl) {
    const configuredOrigin = new URL(configuredFrontendUrl).origin;
    return `${configuredOrigin}${FRONTEND_GOOGLE_CALLBACK_PATH}`;
  }

  if (process.env.NODE_ENV === "production") {
    return `${DEFAULT_PRODUCTION_FRONTEND_URL}${FRONTEND_GOOGLE_CALLBACK_PATH}`;
  }

  return `${DEFAULT_PRODUCTION_FRONTEND_URL}${FRONTEND_GOOGLE_CALLBACK_PATH}`;
};

const validateRequestedRedirectUri = (redirectUri) => {
  const normalizedRedirectUri = normalizeRedirectUri(redirectUri);

  if (!normalizedRedirectUri) {
    return null;
  }

  const configuredRedirectUris = getConfiguredRedirectUris();

  if (configuredRedirectUris.has(normalizedRedirectUri)) {
    return normalizedRedirectUri;
  }

  return null;
};

const encodeGoogleAuthState = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeGoogleAuthState = (encodedState) => {
  if (!encodedState) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedState, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
};

const buildGoogleAuthorizationUrl = ({ req, frontendRedirectUri, role }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google OAuth is not configured on the server");
  }

  const resolvedFrontendRedirectUri = resolveFrontendRedirectUri(
    frontendRedirectUri
  );

  if (!resolvedFrontendRedirectUri) {
    throw new Error("Frontend Google callback URL is not configured");
  }

  const state = encodeGoogleAuthState({
    frontendRedirectUri: resolvedFrontendRedirectUri,
    role: role === "host" ? "host" : "user",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleCallbackUrl(req),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const buildFrontendCallbackRedirect = ({
  frontendRedirectUri,
  status,
  error,
  errorDescription,
}) => {
  const targetUrl = new URL(frontendRedirectUri);

  if (status) {
    targetUrl.searchParams.set("status", status);
  }

  if (error) {
    targetUrl.searchParams.set("error", error);
  }

  if (errorDescription) {
    targetUrl.searchParams.set("error_description", errorDescription);
  }

  return targetUrl.toString();
};

const exchangeCodeForGoogleProfile = async ({ code, redirectUri }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const configuredRedirectUri = normalizeRedirectUri(
    process.env.GOOGLE_REDIRECT_URI
  );

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured on the server");
  }

  const validatedRedirectUri = validateRequestedRedirectUri(redirectUri);

  if (redirectUri && !validatedRedirectUri) {
    throw new Error(
      `Google redirect URI is not allowed. Requested "${redirectUri}".`
    );
  }

  const resolvedRedirectUri = validatedRedirectUri || configuredRedirectUri;

  if (!resolvedRedirectUri) {
    throw new Error("Google redirect URI is not configured");
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: resolvedRedirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await axios.post(
    GOOGLE_TOKEN_URL,
    tokenParams.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      proxy: false,
      timeout: 10000,
    }
  );

  const accessToken = tokenResponse.data?.access_token;

  if (!accessToken) {
    throw new Error("Google token exchange failed");
  }

  const profileResponse = await axios.get(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    proxy: false,
    timeout: 10000,
  });

  return profileResponse.data;
};

module.exports = {
  buildFrontendCallbackRedirect,
  buildGoogleAuthorizationUrl,
  decodeGoogleAuthState,
  exchangeCodeForGoogleProfile,
  getGoogleCallbackUrl,
  resolveFrontendRedirectUri,
};
