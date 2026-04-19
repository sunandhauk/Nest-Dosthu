import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { startGoogleAuth } from "../utils/googleAuth";
import nestDosthuLogo from "../assets/nest-dosthu-logo.jpeg";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  const { login, isAuthenticated, error: authError, resetPassword } = useAuth();
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if ((formData.email.match(/\.com/g) || []).length > 1) {
      setError("Invalid email address. Email contains multiple '.com' domains.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate("/", { replace: true });
      } else if (
        result.error &&
        (result.error.includes("Invalid email or password") ||
          result.error.includes("Invalid credentials"))
      ) {
        setError("Invalid email or password");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setSocialLoading("google");
    setError("");

    try {
      startGoogleAuth({ role: role === "host" ? "host" : "user" });
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
      setSocialLoading("");
    }
  };

  const handleFacebookLogin = () => {
    setSocialLoading("facebook");
    setError("");

    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;

    if (!appId || appId === "your-facebook-app-id") {
      setError("Facebook Login is not configured in this environment.");
      setSocialLoading("");
      return;
    }

    try {
      const fbAuthUrl = "https://www.facebook.com/v12.0/dialog/oauth";
      const redirectUri = `${window.location.origin}/auth/facebook/callback`;
      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "email,public_profile",
      });

      window.location.href = `${fbAuthUrl}?${params.toString()}`;
    } catch (err) {
      setError("Facebook login failed. Please try again.");
      setSocialLoading("");
    }
  };

  const cardClass = isDark
    ? "w-full max-w-md animate-fade-in rounded-3xl border border-red-500 bg-black/95 p-5 text-white shadow-2xl"
    : "w-full max-w-md animate-fade-in rounded-3xl border border-red-200 bg-white/95 p-5 text-black shadow-2xl";
  const headingBadgeClass = isDark
    ? "inline-block rounded-2xl bg-white px-4 py-2 text-2xl font-bold text-black"
    : "inline-block rounded-2xl bg-black px-4 py-2 text-2xl font-bold text-white";
  const bodyTextClass = isDark ? "text-white/70 text-xs" : "text-gray-600 text-xs";
  const inputClass = isDark
    ? "w-full rounded-xl border-2 border-red-500 bg-black px-4 py-2 text-sm text-white placeholder:text-white/45 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300"
    : "w-full rounded-xl border-2 border-red-200 bg-white px-4 py-2 text-sm text-black placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300";
  const socialButtonClass = isDark
    ? "flex items-center justify-center rounded-xl border-2 border-red-500 bg-black p-2 text-white transition-all duration-300 hover:border-red-400 hover:shadow-lg hover:scale-105"
    : "flex items-center justify-center rounded-xl border-2 border-red-200 bg-white p-2 transition-all duration-300 hover:border-red-400 hover:shadow-lg hover:scale-105";
  const dividerLineClass = isDark ? "w-full border-t border-red-500/60" : "w-full border-t border-red-200";
  const dividerTextClass = isDark
    ? "px-3 bg-black text-white/75 font-medium"
    : "px-3 bg-white text-gray-500 font-medium";
  const linkClass = isDark
    ? "font-semibold text-red-400 transition-all hover:text-red-300"
    : "font-semibold text-red-600 transition-all hover:text-red-700";
  const iconButtonClass = isDark
    ? "absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 transition-colors hover:text-white"
    : "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600";

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          alt="Modern luxury apartment"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-start justify-center pt-8">
        <div className={cardClass}>
          <div className="mb-3 text-center">
            <div className="mb-3 inline-block rounded-[24px] border border-amber-300/35 bg-[#12070a] p-2 shadow-lg transition-transform duration-300 hover:scale-105">
              <img
                src={nestDosthuLogo}
                alt="Nest Dosthu logo"
                className="h-12 w-12 rounded-2xl object-cover"
              />
            </div>
            <h1 className={headingBadgeClass}>{roleLabel} Login</h1>
            <p className={bodyTextClass}>
              {showForgotPassword
                ? `Recover your ${roleLabel.toLowerCase()} account`
                : role === "host"
                  ? "Login to manage listings and receive tenant enquiries"
                  : "Login to browse rooms and connect with hosts"}
            </p>
          </div>

          {error && (
            <div
              className={`relative mb-3 rounded-lg border-l-4 border-red-500 px-3 py-2 text-xs animate-shake ${
                isDark ? "bg-black text-white" : "bg-red-50 text-red-700"
              }`}
            >
              <p className="font-medium">{error}</p>
              <button
                type="button"
                className={`absolute right-2 top-2 ${
                  isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"
                }`}
                onClick={() => setError("")}
              >
                x
              </button>
            </div>
          )}

          {resetSent && (
            <div
              className={`mb-3 rounded-lg border-l-4 border-red-500 px-3 py-2 text-xs ${
                isDark ? "bg-black text-white" : "bg-green-50 text-green-700"
              }`}
            >
              <p className="font-medium">Password reset email sent. Please check your inbox.</p>
            </div>
          )}

          {showForgotPassword ? (
            <form className="space-y-3" onSubmit={handlePasswordReset}>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                placeholder="Enter your email address"
                className={inputClass}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-500 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <p className={`mt-3 text-center text-xs ${isDark ? "text-white/70" : "text-gray-600"}`}>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className={linkClass}
                >
                  Back to login
                </button>
              </p>
            </form>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={socialLoading !== ""}
                  className={socialButtonClass}
                >
                  {socialLoading === "google" ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-r-2 border-t-2 border-blue-500" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={socialLoading !== ""}
                  className={socialButtonClass}
                >
                  {socialLoading === "facebook" ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-r-2 border-t-2 border-blue-600" />
                  ) : (
                    <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                </button>

                <button type="button" className={socialButtonClass}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </button>
              </div>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className={dividerLineClass} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={dividerTextClass}>or continue with email</span>
                </div>
              </div>

              <form className="space-y-2" onSubmit={handleSubmit}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className={inputClass}
                />

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    className={iconButtonClass}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <input
                      id="remember_me"
                      name="remember_me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleCheckboxChange}
                      className="h-3 w-3 cursor-pointer rounded border-red-400 text-red-500 focus:ring-red-500"
                    />
                    <label
                      htmlFor="remember_me"
                      className={`ml-2 block cursor-pointer select-none ${isDark ? "text-white/70" : "text-gray-600"}`}
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.email || formData.email.trim() === "") {
                        setError("Please enter your email address before requesting a password reset.");
                      } else {
                        setShowForgotPassword(true);
                        setResetEmail(formData.email);
                      }
                    }}
                    className={linkClass}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary-500 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>

              <p className={`mt-3 text-center text-xs ${isDark ? "text-white/70" : "text-gray-600"}`}>
                Don&apos;t have a {roleLabel.toLowerCase()} account?{" "}
                <Link to={`/register?role=${role}`} className={linkClass}>
                  Create a new account
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
