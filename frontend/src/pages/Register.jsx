import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { Eye, EyeOff } from "lucide-react";
import { startGoogleAuth } from "../utils/googleAuth";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isAuthenticated, error: authError } = useAuth();
  const { theme } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get("role") || "tenant";
  const roleLabel = role === "host" ? "Host" : "Tenant";
  const isDark = theme === "dark";

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        username: formData.username || formData.email.split("@")[0],
        role: role === "host" ? "host" : "user",
      });

      if (result.success) {
        navigate("/", { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setSocialLoading("google");
    setError("");

    try {
      startGoogleAuth({ role: role === "host" ? "host" : "user" });
    } catch (err) {
      setError(err.message || "Google sign-up failed. Please try again.");
      setSocialLoading("");
    }
  };

  const inputStyle =
    "w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-sm";
  const headingBadgeClass = isDark
    ? "inline-block rounded-2xl bg-white px-4 py-2 text-2xl font-bold text-black"
    : "inline-block rounded-2xl bg-black px-4 py-2 text-2xl font-bold text-white";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
          alt="Modern luxury apartment"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full flex items-start justify-center min-h-screen pt-8">
        <div className="w-full max-w-md animate-fade-in bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-5">
          <div className="mb-3 text-center">
            <h1 className={headingBadgeClass}>{roleLabel} Sign Up</h1>
            <p className="text-gray-600 text-xs">
              {role === "host" ? "Create your host account and start publishing rooms." : "Create your tenant account and start exploring rooms."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs animate-shake">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={socialLoading !== ""}
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {socialLoading === "google" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 font-medium text-gray-500">
                or create an account with email
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg mb-3 text-xs">
            {role === "host"
              ? "Create your host account with Google or use email and password."
              : "Create your tenant account with Google or use email and password."}
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <div className="relative group w-1/2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className={inputStyle}
                />
              </div>
              <div className="relative group w-1/2">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="relative group">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username (optional)"
                className={inputStyle}
              />
            </div>

            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className={inputStyle}
              />
            </div>

            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`${inputStyle} pr-11`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative group">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={`${inputStyle} pr-11`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                `Create ${roleLabel} Account`
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-gray-600">
            Already have a {roleLabel.toLowerCase()} account?{" "}
            <Link
              to={`/login?role=${role}`}
              className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
