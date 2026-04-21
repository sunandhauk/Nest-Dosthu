import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getGoogleRedirectUri } from "../utils/googleAuth";

const getHelpfulGoogleAuthError = (message) => {
  if (!message) {
    return "Google sign-in failed.";
  }

  if (
    message.includes("redirect_uri_mismatch") ||
    message.includes("redirect URI mismatch")
  ) {
    return `Google sign-in failed because the redirect URI does not match. Please make sure Google Console, REACT_APP_GOOGLE_REDIRECT_URI, and GOOGLE_REDIRECT_URI all use "${getGoogleRedirectUri()}".`;
  }

  if (message.includes("not configured")) {
    return "Google sign-in is not configured correctly yet. Please add the Google client ID, secret, and redirect URI in your environment files.";
  }

  return message;
};

const getProviderErrorMessage = (providerError, providerErrorDescription) => {
  if (providerError === "access_denied") {
    return "Google sign-in was cancelled or denied.";
  }

  if (providerErrorDescription) {
    return getHelpfulGoogleAuthError(providerErrorDescription);
  }

  if (providerError) {
    return getHelpfulGoogleAuthError(providerError);
  }

  return "Google sign-in failed.";
};

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { completeOAuthRedirectLogin, googleAuth } = useAuth();
  const [error, setError] = useState("");
  const hasProcessedAuth = useRef(false);

  useEffect(() => {
    if (hasProcessedAuth.current) {
      return;
    }

    hasProcessedAuth.current = true;

    const completeGoogleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const status = params.get("status");
      const providerError = params.get("error");
      const providerErrorDescription = params.get("error_description");

      if (providerError) {
        setError(
          getProviderErrorMessage(providerError, providerErrorDescription)
        );
        return;
      }

      if (status === "success") {
        const result = await completeOAuthRedirectLogin();

        if (result.success) {
          navigate("/", { replace: true });
          return;
        }

        setError(getHelpfulGoogleAuthError(result.error));
        return;
      }

      if (!code) {
        setError("Google sign-in did not return an authorization code.");
        return;
      }

      const result = await googleAuth(code, getGoogleRedirectUri(), "user");

      if (result.success) {
        navigate("/", { replace: true });
        return;
      }

      setError(getHelpfulGoogleAuthError(result.error));
    };

    completeGoogleAuth();
  }, [completeOAuthRedirectLogin, googleAuth, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Finishing Google sign-in
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          We&apos;re connecting your Google account and preparing your session.
        </p>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
