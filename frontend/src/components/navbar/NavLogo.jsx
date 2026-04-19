import React from "react";
import { Link } from "react-router-dom";
import nestDosthuLogo from "../../assets/nest-dosthu-logo.jpeg";
import { useAppSettings } from "../../contexts/AppSettingsContext";

const NavLogo = () => {
  const { theme } = useAppSettings();

  return (
    <Link
      to="/"
      className="group flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-all duration-300 shrink-0 dark-logo-shell"
      aria-label="Nest Dosthu - Home"
    >
      <div className="relative shrink-0 overflow-hidden rounded-[20px] border border-amber-300/35 bg-[#12070a] p-1.5 shadow-[0_10px_30px_rgba(18,7,10,0.22)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.02]">
        <img
          src={nestDosthuLogo}
          alt="Nest Dosthu logo"
          className={`relative h-11 w-11 rounded-2xl object-cover md:h-14 md:w-14 ${theme === "dark" ? "dark-logo-mark" : ""}`}
        />
      </div>

      <div className="flex flex-col">
        <span
          className={`text-lg font-bold leading-tight transition-colors duration-300 md:text-2xl ${
            theme === "dark"
              ? "text-white"
              : "text-neutral-900 group-hover:text-amber-700"
          }`}
        >
          Nest Dosthu
        </span>
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.28em] transition-transform duration-300 group-hover:translate-x-1 md:text-xs ${
            theme === "dark" ? "text-amber-200" : "text-amber-600"
          }`}
        >
          Find Your Nest
        </span>
      </div>
    </Link>
  );
};

export default NavLogo;
