const axios = require("axios");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

const normalizeRedirectUri = (value) => {
  if (!value) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.pathname !== GOOGLE_CALLBACK_PATH) {
      return null;
    }

    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch (error) {
    return null;
  }
};

const isLocalDevelopmentOrigin = (origin) => {
  try {
    const parsedUrl = new URL(origin);
    const { protocol, hostname } = parsedUrl;

    if (protocol !== "http:") {
      return false;
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    return (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch (error) {
    return false;
  }
};

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

const validateRequestedRedirectUri = (redirectUri) => {
  const normalizedRedirectUri = normalizeRedirectUri(redirectUri);

  if (!normalizedRedirectUri) {
    return null;
  }

  const configuredRedirectUris = getConfiguredRedirectUris();

  if (configuredRedirectUris.has(normalizedRedirectUri)) {
    return normalizedRedirectUri;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    isLocalDevelopmentOrigin(new URL(normalizedRedirectUri).origin)
  ) {
    return normalizedRedirectUri;
  }

  return null;
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
  exchangeCodeForGoogleProfile,
};
