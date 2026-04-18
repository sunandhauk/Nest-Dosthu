import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useAuth } from "../contexts/AuthContext";
import NavLogo from "./navbar/NavLogo";
import { getPreferenceSnapshot } from "../utils/tenantVacancies";

const UserAvatar = ({ user, sizeClass = "w-8 h-8", textClass = "text-sm" }) => {
  const [imageError, setImageError] = useState(false);
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  return (
    <div
      className={`bg-primary-500 text-white rounded-full ${sizeClass} flex items-center justify-center overflow-hidden`}
    >
      {user?.profileImage && !imageError ? (
        <img
          src={user.profileImage}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`font-medium ${textClass}`}>{initials || "U"}</span>
      )}
    </div>
  );
};

const ThemeToggle = ({ theme, onToggle, compact = false }) => {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex items-center rounded-full border border-red-300 bg-[linear-gradient(135deg,rgba(255,237,237,0.98),rgba(254,226,226,0.96),rgba(255,255,255,0.98))] p-1 shadow-[0_14px_34px_-24px_rgba(220,38,38,0.72)] transition hover:shadow-[0_18px_38px_-22px_rgba(220,38,38,0.82)] ${
        compact ? "w-[64px]" : "w-[72px]"
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(252,165,165,0.3),transparent_42%)]" />
      <div className={`relative flex w-full items-center ${isDark ? "justify-start" : "justify-end"}`}>
        <motion.div
          layout
          transition={{
            type: "spring",
            visualDuration: 0.2,
            bounce: 0.2,
          }}
          className={`relative flex ${compact ? "h-8 w-8" : "h-9 w-9"} items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#fca5a5_0%,#ef4444_34%,#dc2626_68%,#991b1b_100%)] text-white shadow-[0_12px_28px_-14px_rgba(220,38,38,0.95)]`}
        >
          <span className="absolute inset-[4px] rounded-full border border-white/25" />
          <i className={`fas ${isDark ? "fa-sun" : "fa-moon"} relative z-10 text-xs`} />
        </motion.div>
      </div>
    </button>
  );
};

const Navbar = () => {
  // State for UI controls
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferenceSnapshot, setPreferenceSnapshot] = useState(getPreferenceSnapshot);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, right: 16 });
  const [getStartedMenuPosition, setGetStartedMenuPosition] = useState({ top: 0, right: 16 });
  const settingsRef = useRef(null);
  const preferencesRef = useRef(null);
  const preferencesPanelRef = useRef(null);
  const getStartedRef = useRef(null);
  const getStartedButtonRef = useRef(null);
  const getStartedMenuRef = useRef(null);
  const menuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { pathname } = useLocation();
  const location = useLocation();
  const navigate = useNavigate();

  // Use auth context
  const { currentUser, logout, isAuthenticated } = useAuth();

  // Use the app settings context
  const {
    language,
    languageName,
    currency,
    theme,
    changeLanguage,
    changeCurrency,
    toggleTheme,
    supportedLanguages,
    getText,
    isTranslating,
    isLoadingRates,
  } = useAppSettings();

  // Available currencies
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
  ];

  // Close profile and settings menus on route change
  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsGetStartedOpen(false);
    setIsPreferencesOpen(false);
  }, [location.pathname]);

  // Handle clicks outside dropdown menus and keyboard navigation
  useEffect(() => {
    const isInsideRef = (ref, target) => ref.current && ref.current.contains(target);

    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsMenuOpen(false);
      }
      if (
        preferencesRef.current &&
        !preferencesRef.current.contains(event.target) &&
        (!preferencesPanelRef.current ||
          !preferencesPanelRef.current.contains(event.target))
      ) {
        setIsPreferencesOpen(false);
      }
      if (
        getStartedRef.current &&
        !getStartedRef.current.contains(event.target) &&
        !isInsideRef(getStartedMenuRef, event.target)
      ) {
        setIsGetStartedOpen(false);
      }
      if (
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target) &&
        !isInsideRef(profileMenuRef, event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSettingsMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsGetStartedOpen(false);
        setIsPreferencesOpen(false);
      }

      // Handle Tab key to manage focus trap in menus
      if (event.key === "Tab" && (isSettingsMenuOpen || isProfileMenuOpen || isPreferencesOpen)) {
        const menu = isSettingsMenuOpen
          ? menuRef.current
          : isPreferencesOpen
            ? preferencesPanelRef.current
            : null;

        if (!menu) {
          return;
        }

        const focusableElements = menu.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements.length) {
          return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // If shift + tab and first element is focused, move to last
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          // If tab and last element is focused, move to first
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsMenuOpen, isProfileMenuOpen, isPreferencesOpen]);

  const navigateToAuth = (role, mode) => {
    setIsGetStartedOpen(false);
    navigate(`/${mode}?role=${role}`);
  };

  // Control body scrolling when settings modal is open
  useEffect(() => {
    // Prevent body scrolling when modal-style overlays are open
    if (isSettingsMenuOpen || isPreferencesOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPreferencesOpen, isSettingsMenuOpen]);

  useEffect(() => {
    const syncPreferences = () => {
      setPreferenceSnapshot(getPreferenceSnapshot());
    };

    syncPreferences();
    window.addEventListener("tenantPreferencesUpdated", syncPreferences);
    window.addEventListener("storage", syncPreferences);

    return () => {
      window.removeEventListener("tenantPreferencesUpdated", syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  const getRightAlignedMenuPosition = (buttonRect, menuWidth) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalMargin = 16;
    const top = Math.min(buttonRect.bottom + 12, viewportHeight - 24);
    const right = Math.max(horizontalMargin, viewportWidth - buttonRect.right);
    const left = viewportWidth - right - menuWidth;

    if (left < horizontalMargin) {
      return {
        top,
        right: Math.max(horizontalMargin, viewportWidth - horizontalMargin - menuWidth),
      };
    }

    return { top, right };
  };

  const updateProfileMenuPosition = () => {
    if (!profileButtonRef.current) {
      return;
    }

    setProfileMenuPosition(
      getRightAlignedMenuPosition(profileButtonRef.current.getBoundingClientRect(), 288)
    );
  };

  const updateGetStartedMenuPosition = () => {
    if (!getStartedButtonRef.current) {
      return;
    }

    setGetStartedMenuPosition(
      getRightAlignedMenuPosition(getStartedButtonRef.current.getBoundingClientRect(), 320)
    );
  };

  useEffect(() => {
    if (!isProfileMenuOpen && !isGetStartedOpen) {
      return;
    }

    const handleViewportChange = () => {
      if (isProfileMenuOpen) {
        updateProfileMenuPosition();
      }
      if (isGetStartedOpen) {
        updateGetStartedMenuPosition();
      }
    };

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isProfileMenuOpen, isGetStartedOpen]);

  const preferencesContent = (
    <div
      className="fixed inset-0 z-[1400] flex items-start justify-center bg-black/65 p-4 pt-24 backdrop-blur-sm sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsPreferencesOpen(false);
        }
      }}
    >
      <div
        ref={preferencesPanelRef}
        className={`w-full max-w-lg max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[28px] border p-5 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.48)] ${
          theme === "dark"
            ? "border-red-400/50 bg-black text-white"
            : "border-orange-200/70 bg-[linear-gradient(180deg,_rgba(255,247,242,0.98)_0%,_rgba(255,235,220,0.96)_100%)] text-black"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p
              id="preferences-modal-title"
              className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}
            >
              Roommate preferences
            </p>
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-white/80" : "text-neutral-600"}`}>
              {isAuthenticated
                ? "Hidden by default and pulled from your latest room-sharing draft or listing."
                : "Preview the roommate preference fields shown in the tenant room-sharing flow."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(false)}
            className={`rounded-full border px-3 py-2 text-sm transition ${
              theme === "dark"
                ? "border-red-400/50 bg-black text-white hover:border-red-300"
                : "border-orange-200 bg-white text-black hover:border-orange-300"
            }`}
            aria-label="Close preferences"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        {isAuthenticated ? (
          <>
            <div
              className={`space-y-3 rounded-[24px] border p-4 text-sm ${
                theme === "dark"
                  ? "border-red-400/30 bg-black text-white"
                  : "border-orange-200/70 bg-white/80 text-neutral-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Gender preference</span>
                <span className="max-w-[55%] break-words text-right font-medium">{preferenceSnapshot.gender}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Occupation</span>
                <span className="max-w-[55%] break-words text-right font-medium">
                  {preferenceSnapshot.occupation?.length
                    ? preferenceSnapshot.occupation.join(", ")
                    : "Any"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Smoking habits</span>
                <span className="max-w-[55%] break-words text-right font-medium">{preferenceSnapshot.smoking}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Drinking habits</span>
                <span className="max-w-[55%] break-words text-right font-medium">{preferenceSnapshot.drinking}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Cleanliness</span>
                <span className="max-w-[55%] break-words text-right font-medium">{preferenceSnapshot.cleanliness}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Interests</span>
                <span className="max-w-[55%] break-words text-right font-medium">
                  {preferenceSnapshot.interests || "Not specified"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Sleep schedule</span>
                <span className="max-w-[55%] break-words text-right font-medium">
                  {preferenceSnapshot.sleepSchedule || "Not specified"}
                </span>
              </div>
            </div>

            <Link
              to="/tenant/room-sharing"
              className={`mt-4 inline-flex items-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                theme === "dark"
                  ? "border-red-400/50 bg-black text-white hover:border-red-300"
                  : "border-orange-200 bg-white text-black hover:border-orange-300"
              }`}
              onClick={() => setIsPreferencesOpen(false)}
            >
              Update room-sharing preferences
            </Link>
          </>
        ) : (
          <>
            <div
              className={`space-y-3 rounded-[24px] border p-4 text-sm ${
                theme === "dark"
                  ? "border-red-400/30 bg-black text-white"
                  : "border-orange-200/70 bg-white/80 text-neutral-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Gender preference</span>
                <span className="max-w-[55%] break-words text-right font-medium">Male / Female / Any</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Occupation</span>
                <span className="max-w-[55%] break-words text-right font-medium">Student / Working</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Smoking / Drinking</span>
                <span className="max-w-[55%] break-words text-right font-medium">Lifestyle habits</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Cleanliness</span>
                <span className="max-w-[55%] break-words text-right font-medium">Hygiene expectations</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Interests</span>
                <span className="max-w-[55%] break-words text-right font-medium">Gaming, movies, fitness</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className={theme === "dark" ? "text-white/70" : "text-neutral-500"}>Other preferences</span>
                <span className="max-w-[55%] break-words text-right font-medium">Sleep schedule and more</span>
              </div>
            </div>

            <div
              className={`mt-4 flex items-center justify-between gap-3 rounded-[24px] border px-4 py-4 ${
                theme === "dark"
                  ? "border-red-400/30 bg-black"
                  : "border-orange-200/70 bg-white/85"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Tenant access</p>
                <p className={`mt-1 text-xs ${theme === "dark" ? "text-white/70" : "text-neutral-500"}`}>
                  Sign in as tenant to post vacancy and manage these preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPreferencesOpen(false);
                  navigate("/login?role=tenant");
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Tenant Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const settingsMenuContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={menuRef}
        className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 ease-out
          sm:max-w-xl sm:w-full"
        style={{
          animation: "fadeInUp 0.3s ease-out",
          maxWidth: "min(90vw, 32rem)",
          marginTop: Math.min(
            menuPosition.y + 20,
            window.innerHeight - 600
          ),
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <h2
            id="settings-modal-title"
            className="text-xl font-bold text-neutral-800"
          >
            Language and Currency
          </h2>
          <div className="flex items-center">
            <span
              className="text-sm text-neutral-500 mr-3"
              role="status"
              aria-live="polite"
            >
              Currently: {languageName}, {currency}
            </span>
            <button
              onClick={() => setIsSettingsMenuOpen(false)}
              className="text-neutral-500 hover:text-neutral-700 p-2 rounded-full hover:bg-neutral-100 transition duration-200"
              aria-label="Close settings"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-neutral-200">
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Appearance</p>
              <p className="mt-1 text-xs text-neutral-500">
                Switch between light and dark mode anytime.
              </p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            Select a language
          </h3>

          {isTranslating ? (
            <div className="flex justify-center py-8">
              <i className="fas fa-spinner fa-spin text-primary-500 mr-2 text-xl"></i>
              <span className="text-neutral-700">
                Loading translations...
              </span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="font-medium text-neutral-700 mb-2">
                  Suggested languages
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedLanguages.slice(0, 6).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() =>
                        handleLanguageChange(lang.code, lang.name)
                      }
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                        language === lang.code
                          ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                          : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-neutral-700 mb-2">
                  All languages
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() =>
                        handleLanguageChange(lang.code, lang.name)
                      }
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                        language === lang.code
                          ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                          : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            Select a currency
          </h3>

          {isLoadingRates ? (
            <div className="flex justify-center py-8">
              <i className="fas fa-spinner fa-spin text-primary-500 mr-2 text-xl"></i>
              <span className="text-neutral-700">
                Loading exchange rates...
              </span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="font-medium text-neutral-700 mb-2">
                  Popular currencies
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currencies.slice(0, 4).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() =>
                        handleCurrencyChange(curr.code)
                      }
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                        currency === curr.code
                          ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                          : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <span className="mr-2 font-bold">
                        {curr.symbol}
                      </span>
                      <span>
                        {curr.code} - {curr.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-neutral-700 mb-2">
                  All currencies
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() =>
                        handleCurrencyChange(curr.code)
                      }
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                        currency === curr.code
                          ? "bg-primary-50 text-primary-600 font-medium border-2 border-primary-200"
                          : "text-neutral-700 hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <span className="mr-2 font-bold">
                        {curr.symbol}
                      </span>
                      <span>
                        {curr.code} - {curr.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Handler for changing language
  const handleLanguageChange = async (langCode, langName) => {
    try {
      setIsSettingsLoading(true);
      await changeLanguage(langCode, langName);
    } finally {
      setIsSettingsLoading(false);
      setIsSettingsMenuOpen(false);
    }
  };

  // Handler for changing currency
  const handleCurrencyChange = async (currencyCode) => {
    try {
      setIsSettingsLoading(true);
      await changeCurrency(currencyCode);
    } finally {
      setIsSettingsLoading(false);
      setIsSettingsMenuOpen(false);
    }
  };

  // Handler for user logout action
  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const profileMenuContent =
    isProfileMenuOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={profileMenuRef}
        className="navbar-dropdown-layer w-72 rounded-xl border border-neutral-200 bg-white py-1 shadow-card"
        style={{ top: profileMenuPosition.top, right: profileMenuPosition.right }}
      >
        {!isAuthenticated ? (
          <div className="py-1">
            <Link
              to="/login"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {getText("common", "login")}
            </Link>
            <Link
              to="/register"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {getText("common", "signup")}
            </Link>
            <Link
              to="/host/become-a-host"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {getText("common", "becomeHost")}
            </Link>
            <Link
              to="/help"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {getText("common", "help")}
            </Link>
          </div>
        ) : (
          <>
            <div className="p-4">
              <div className="flex items-center">
                <div className="mr-3">
                  <UserAvatar
                    user={currentUser}
                    sizeClass="w-10 h-10"
                    textClass="text-sm"
                  />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">{currentUser.email}</p>
                </div>
              </div>
            </div>
            <div className="py-1">
              <Link
                to="/messages"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {getText("common", "messages")}
              </Link>
              <Link
                to="/trips"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {getText("common", "trips")}
              </Link>
              <Link
                to="/wishlist"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {getText("common", "wishlist")}
              </Link>
            </div>
            <div className="py-1">
              <Link
                to="/host/listings"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Manage listings
              </Link>
              <Link
                to="/tenant/room-sharing"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Post vacancy
              </Link>
              <Link
                to="/tenant/swipe-matching"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Smart Swipe matches
              </Link>
              <Link
                to="/account"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {getText("common", "account")}
              </Link>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={handleLogout}
              >
                {getText("common", "logout")}
              </button>
              <Link
                to="/help"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                {getText("common", "help")}
              </Link>
            </div>
          </>
        )}
      </div>,
      document.body
    );

  const getStartedMenuContent =
    isGetStartedOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={getStartedMenuRef}
        className="navbar-dropdown-layer w-80 overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-3 shadow-card"
        style={{ top: getStartedMenuPosition.top, right: getStartedMenuPosition.right }}
      >
        <div className="mb-2 px-2 py-1">
          <p className="text-sm font-semibold text-neutral-900">Choose your role</p>
          <p className="text-xs text-neutral-500">Continue with the right sign up or login flow.</p>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <i className="fas fa-house-user" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Host</p>
                <p className="text-xs text-neutral-500">Publish rooms and manage listings</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigateToAuth("host", "register")} className="flex-1 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-700">Sign Up</button>
              <button onClick={() => navigateToAuth("host", "login")} className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700">Login</button>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <i className="fas fa-user" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Tenant</p>
                <p className="text-xs text-neutral-500">Search rooms and contact hosts</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigateToAuth("tenant", "register")} className="flex-1 rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-700">Sign Up</button>
              <button onClick={() => navigateToAuth("tenant", "login")} className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700">Login</button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <nav className="bg-white py-4 px-2 md:px-6 sticky top-0 z-[1200] shadow-sm">
      <div className="container relative z-[1201] mx-auto">
        {/* Main navigation bar with logo and menu items */}
        <div className="flex justify-between items-center">
          {/* Logo */}
          <NavLogo />

          {/* Explore Button - Added next to the logo */}
          {location.pathname === "/" && (
            <div className="hidden md:block ml-4 lg:ml-12">
              <Link
                to="/listings"
                className="flex items-center px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition duration-300 shadow-sm hover:shadow-md gap-2"
                aria-label="Explore Properties"
              >
                <i className="fas fa-compass text-lg"></i>
                <span className="font-medium">Explore</span>
              </Link>
            </div>
          )}

          {/* Navigation - Responsive */}
          <div className="flex items-center gap-1 md:gap-2">
            {!isAuthenticated && (
              <div ref={getStartedRef} className="relative hidden sm:block">
                <button
                  ref={getStartedButtonRef}
                  type="button"
                  onClick={() => {
                    if (!isGetStartedOpen) {
                      updateGetStartedMenuPosition();
                    }
                    setIsProfileMenuOpen(false);
                    setIsGetStartedOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md"
                >
                  <span>Get Started</span>
                  <i className={`fas fa-chevron-${isGetStartedOpen ? "up" : "down"} text-[10px]`} />
                </button>

              </div>
            )}

            <div ref={preferencesRef} className="relative block">
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    setIsProfileMenuOpen(false);
                    setIsGetStartedOpen(false);
                    setIsPreferencesOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 md:px-4 md:py-2.5"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  aria-expanded={isPreferencesOpen}
                  aria-haspopup="dialog"
                >
                  <i className="fas fa-sliders-h text-xs" />
                  <span className="text-xs sm:text-sm">Preferences</span>
                </motion.button>
              </div>

            <div className="flex">
              <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
            </div>

            {/* Language and Currency Selector */}
            <div ref={settingsRef} className="relative">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPosition({ x: rect.left, y: rect.bottom });
                  setIsPreferencesOpen(false);
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }}
                className="flex items-center justify-center p-2 text-neutral-700 hover:text-neutral-900 transition duration-200 relative"
                aria-label="Language and Currency Settings"
                aria-expanded={isSettingsMenuOpen}
                aria-haspopup="dialog"
              >
                <div className="relative">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12H22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="sr-only">
                    Current language: {languageName}, Currency: {currency}
                  </span>
                </div>
                {isSettingsLoading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className="absolute w-full h-full rounded-full border-2 border-t-transparent border-primary-500 animate-spin"></div>
                  </div>
                )}
              </button>

            </div>

            {/* User profile menu */}

            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => {
                  if (!isProfileMenuOpen) {
                    updateProfileMenuPosition();
                  }
                  setIsGetStartedOpen(false);
                  setIsProfileMenuOpen((prev) => !prev);
                }}
                className="flex items-center space-x-2 border border-neutral-300 p-2 rounded-full hover:shadow-md transition duration-200"
                aria-label="User menu"
              >
                <i className="fas fa-bars text-neutral-500"></i>
                {isAuthenticated && currentUser ? (
                  <UserAvatar user={currentUser} />
                ) : (
                  <div className="bg-neutral-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </button>

            </div>
            </div>
          </div>
        </div>

      </nav>
      {getStartedMenuContent}
      {profileMenuContent}
      {isSettingsMenuOpen &&
        typeof document !== "undefined" &&
        createPortal(settingsMenuContent, document.body)}
      {isPreferencesOpen &&
        typeof document !== "undefined" &&
        createPortal(preferencesContent, document.body)}
    </>
  );
};
export default Navbar;
