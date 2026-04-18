import React from "react";
import { Link } from "react-router-dom";
import logoSvg from "../../../src/logo.svg";
import { useAppSettings } from "../../contexts/AppSettingsContext";

const NavLogo = () => {
  const { theme } = useAppSettings();

  return (
    <Link
      to="/"
      className="group flex items-center space-x-3 px-2 py-1 rounded-lg hover:bg-neutral-50 transition-all duration-300 shrink-0 dark-logo-shell"
      aria-label="Smart Rent System - Home"
    >
      {/* Logo Container with Hover Effect */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-red-500/10 rounded-full scale-110 group-hover:scale-125 transition-transform duration-300 ease-out" />
        <img
          src={logoSvg}
          alt="Smart Rent Logo"
          className={`relative h-10 w-10 md:h-12 md:w-12 object-contain transform group-hover:scale-105 transition-transform duration-300 ${theme === "dark" ? "dark-logo-mark" : ""}`}
        />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div>
          <span
            className={`text-lg md:text-2xl font-bold transition-colors duration-300 ${
              theme === "dark"
                ? "text-white"
                : "text-neutral-900 group-hover:text-red-600"
            }`}
          >
            Smart Rent
          </span>
        </div>
        <span
          className={`text-xs md:text-sm font-semibold tracking-wider transform group-hover:translate-x-1 transition-transform duration-300 ${
            theme === "dark" ? "text-red-200" : "text-red-500"
          }`}
        >
          SYSTEM
        </span>
      </div>
    </Link>
  );
};

export default NavLogo;
