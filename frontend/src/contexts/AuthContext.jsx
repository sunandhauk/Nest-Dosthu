import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken } from "../config/api";
import { startGoogleAuth, getGoogleRedirectUri } from "../utils/googleAuth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyAuthenticatedUser = (authData) => {
    if (authData && authData.token) {
      setAccessToken(authData.token);
      setCurrentUser({
        _id: authData._id,
        username: authData.username,
        email: authData.email,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: authData.role,
        profileImage: authData.profileImage,
        phone: authData.phone || "",
        referralCode: authData.referralCode || "",
      });
      return true;
    }

    setAccessToken(null);
    setCurrentUser(null);
    return false;
  };

  useEffect(() => {
    // Check if user is already logged in via refresh token in cookie
    const checkLoggedIn = async () => {
      try {
        // Attempt to refresh token on mount
        const res = await api.post("/api/users/refresh");

        if (applyAuthenticatedUser(res.data)) {
          console.log("User session restored via refresh token");
        }
      } catch (err) {
        console.log("No active session or refresh token expired");
        setAccessToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      setError("");
      setCurrentUser(null);
      setAccessToken(null);

      console.log("Registering with data:", userData);
      const res = await api.post("/api/users/register", userData);
      console.log("Registration response:", res.data);

      applyAuthenticatedUser(res.data);

      return { success: true, data: res.data };
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError("");
      setCurrentUser(null);
      setAccessToken(null);

      console.log("Logging in with:", { email });
      const res = await api.post("/api/users/login", { email, password });
      console.log("Login response:", res.data);

      applyAuthenticatedUser(res.data);

      return { success: true, data: res.data };
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Invalid credentials";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const googleAuth = async (code, redirectUri, role = "user") => {
    try {
      setError("");

      const res = await api.post("/api/users/google", { code, redirectUri, role });

      applyAuthenticatedUser(res.data);

      return { success: true, data: res.data };
    } catch (err) {
      console.error("Google auth error:", err);
      const errorMessage =
        err.response?.data?.message || "Google sign-in failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const completeOAuthRedirectLogin = async () => {
    try {
      setError("");
      const res = await api.post("/api/users/refresh");

      if (!applyAuthenticatedUser(res.data)) {
        return { success: false, error: "Unable to restore Google session." };
      }

      return { success: true, data: res.data };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Unable to restore Google session.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear all user data
  const clearUserData = () => {
    setAccessToken(null);
    setCurrentUser(null);
    setError("");
  };

  // Logout user
  const logout = async () => {
    try {
      await api.post("/api/users/logout");
      clearUserData();
    } catch (err) {
      console.error("Logout error:", err);
      clearUserData(); // Clear anyway
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError("");
      const res = await api.put("/api/users/profile", userData);
      setCurrentUser(res.data);
      return { success: true, data: res.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Update failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update profile image
  const updateProfileImage = async (file) => {
    try {
      setError("");
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await api.post("/api/users/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.profileImage) {
        const profileImageUrl = res.data.profileImage.includes("?")
          ? res.data.profileImage
          : `${res.data.profileImage}?t=${new Date().getTime()}`;

        setCurrentUser((prevUser) => ({
          ...prevUser,
          profileImage: profileImageUrl,
        }));

        return { success: true, profileImage: profileImageUrl };
      }
      return { success: false, error: "Invalid response from server" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Image upload failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Remove profile image
  const removeProfileImage = async () => {
    try {
      setError("");
      const res = await api.delete("/api/users/profile/image");

      if (res.data && res.data.success) {
        setCurrentUser((prevUser) => ({
          ...prevUser,
          profileImage: "",
        }));
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to remove profile image";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      setError("");
      await api.put("/api/users/password", passwordData);
      return { success: true, message: "Password updated successfully" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Password update failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email) => {
    try {
      setError("");
      await api.post("/api/users/forgot-password", { email });
      return { success: true, message: "Password reset email sent" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Password reset request failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Social login (Google, Facebook)
  const socialLogin = async (provider) => {
    try {
      setError("");

      if (provider === "google") {
        startGoogleAuth({ role: "user" });
        return { success: true };
      }

      if (provider === "facebook") {
        const redirectUri = `${window.location.origin}/auth/facebook/callback`;
        const authUrl = "https://www.facebook.com/v12.0/dialog/oauth";
        const params = {
          client_id:
            process.env.REACT_APP_FACEBOOK_APP_ID || "your-facebook-app-id",
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "email,public_profile",
        };
        const queryString = new URLSearchParams(params).toString();
        window.location.href = `${authUrl}?${queryString}`;
        return { success: true };
      }

      return { success: false, error: `${provider} login is not supported.` };
    } catch (err) {
      const errorMessage =
        provider === "google"
          ? `Google login failed. Please make sure the redirect URI matches "${getGoogleRedirectUri()}".`
          : `${provider} login failed`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    clearUserData,
    updateProfile,
    updatePassword,
    resetPassword,
    socialLogin,
    googleAuth,
    completeOAuthRedirectLogin,
    updateProfileImage,
    removeProfileImage,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
