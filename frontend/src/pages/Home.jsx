import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CHENNAI_AREAS } from "../utils/chennaiListings";
import { useAppSettings } from "../contexts/AppSettingsContext";

const heroQuotes = [
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
  {
    lineOne: "Your perfect stay is just a click away",
    lineTwo: "where comfort meets convenience.",
  },
];

const featuredAreas = [
  {
    name: "Adyar",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    note: "Popular with students and working women",
  },
  {
    name: "Velachery",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    note: "Good metro, office, and shopping access",
  },
  {
    name: "Tambaram",
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    note: "Budget rooms with strong rail connectivity",
  },
  {
    name: "OMR",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    note: "Best fit for IT corridor commuters",
  },
];

const quickHighlights = [
  {
    title: "Curated listings",
    description: "Rooms, PGs, and hostels are presented in a cleaner format so guests can compare options quickly.",
  },
  {
    title: "Tenant-first messaging",
    description: "Tenants can contact hosts directly, while hosts use the inbox only to receive and respond when allowed.",
  },
  {
    title: "Local area search",
    description: "Search by locality such as Adyar, Velachery, Tambaram, OMR, and nearby neighborhoods.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const heroHeadlineWords = [
  "Discover",
  "stays",
  "that",
  "feel",
  "right",
  "from",
  "the",
  "very",
  "first",
  "click.",
];

const headlineContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const headlineWord = {
  hidden: {
    opacity: 0,
    y: 34,
    filter: "blur(12px)",
    clipPath: "inset(0 0 100% 0)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    clipPath: "inset(0 0 0% 0)",
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const Home = () => {
  const navigate = useNavigate();
  const { theme } = useAppSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEntryPopup, setShowEntryPopup] = useState(false);
  const heroSectionRef = useRef(null);
  const vantaEffectRef = useRef(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("entryRoleChoiceDismissed");
    if (!dismissed) {
      setShowEntryPopup(true);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);

        if (existingScript) {
          if (existingScript.dataset.loaded === "true") {
            resolve();
            return;
          }

          existingScript.addEventListener("load", resolve, { once: true });
          existingScript.addEventListener(
            "error",
            () => reject(new Error(`Failed to load script: ${src}`)),
            { once: true }
          );
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.addEventListener("load", () => {
          script.dataset.loaded = "true";
          resolve();
        });
        script.addEventListener(
          "error",
          () => reject(new Error(`Failed to load script: ${src}`)),
          { once: true }
        );
        document.body.appendChild(script);
      });

    const initializeVanta = async () => {
      if (!heroSectionRef.current) {
        return;
      }

      try {
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
        );

        if (isCancelled || !window.VANTA?.NET || !heroSectionRef.current) {
          return;
        }

        if (vantaEffectRef.current?.destroy) {
          vantaEffectRef.current.destroy();
        }

        vantaEffectRef.current = window.VANTA.NET({
          el: heroSectionRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 1,
          color: 0xff3f3f,
          backgroundColor: 0x3c1522,
        });
      } catch (error) {
        console.error("Vanta background failed to initialize:", error);
      }
    };

    initializeVanta();

    return () => {
      isCancelled = true;
      if (vantaEffectRef.current?.destroy) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextLocation = searchQuery.trim();
    navigate(
      nextLocation
        ? `/listings?location=${encodeURIComponent(nextLocation)}`
        : "/listings"
    );
  };

  const closeEntryPopup = () => {
    sessionStorage.setItem("entryRoleChoiceDismissed", "true");
    setShowEntryPopup(false);
  };

  const continueAsHost = () => {
    closeEntryPopup();
    navigate("/host/become-a-host");
  };

  const continueAsTenant = () => {
    closeEntryPopup();
    navigate("/listings?location=Chennai");
  };

  return (
    <div
      className={`transition-colors duration-500 ${
        theme === "dark"
          ? "bg-[linear-gradient(180deg,_#000000_0%,_#050505_38%,_#090909_100%)]"
          : "bg-[linear-gradient(180deg,_#ffe0d2_0%,_#ffedd5_24%,_#ffc7b6_62%,_#fff1e6_100%)]"
      }`}
    >
      <section ref={heroSectionRef} className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(60,21,34,0.76)_0%,_rgba(32,14,32,0.66)_48%,_rgba(15,23,42,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%)]" />
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-6rem] top-20 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-5rem] top-32 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative flex min-h-screen items-center overflow-hidden">
          <div className="absolute inset-0">
            <div className="container mx-auto flex min-h-screen items-center px-4 py-20 sm:py-24">
              <motion.div
                className="max-w-3xl text-white"
                initial="hidden"
                animate="show"
                variants={staggerContainer}
              >
                <motion.span
                  variants={fadeUp}
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.42)",
                    y: -2,
                  }}
                  className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-100 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.28em]"
                >
                  Nest Dosthu System
                </motion.span>
                <motion.h1
                  variants={headlineContainer}
                  initial="hidden"
                  animate="show"
                  className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl md:mt-6 md:text-6xl"
                >
                  {heroHeadlineWords.map((word) => (
                    <motion.span
                      key={word}
                      variants={headlineWord}
                      className="hero-sheen-text mr-[0.28em] inline-block bg-[linear-gradient(92deg,_#ffffff_0%,_#f8fafc_18%,_#d4d4d8_42%,_#ffffff_62%,_#e5e7eb_82%,_#ffffff_100%)] bg-[length:220%_100%] bg-clip-text text-transparent drop-shadow-[0_3px_18px_rgba(15,23,42,0.72)] will-change-transform"
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.h1>

                <motion.div
                  variants={fadeUp}
                  whileHover={{
                    y: -4,
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderColor: "rgba(255,255,255,0.28)",
                  }}
                  className="mt-4 min-h-[84px] max-w-3xl rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur transition duration-500 sm:mt-5 sm:rounded-[24px] sm:px-5"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="quote-primary"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <motion.p
                        animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="bg-gradient-to-r from-rose-200 via-white to-sky-200 bg-[length:200%_100%] bg-clip-text text-base font-semibold text-transparent sm:text-lg md:text-2xl"
                      >
                        {heroQuotes[0].lineOne}
                      </motion.p>
                      <p className="mt-1 text-sm leading-6 text-slate-200 md:text-base">
                        {heroQuotes[0].lineTwo}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                <motion.form
                  variants={fadeUp}
                  onSubmit={handleSearchSubmit}
                  className="mt-7 flex max-w-2xl flex-col gap-3 rounded-[24px] border border-white/15 bg-white/12 p-3 backdrop-blur-md sm:mt-8 sm:rounded-[28px] md:flex-row"
                >
                  <motion.div
                    whileHover={{ backgroundColor: "#fff7f8" }}
                    className="flex flex-1 items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-neutral-700 sm:rounded-[20px] sm:py-4"
                  >
                    <MapPin className="h-5 w-5 text-primary-600" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by area or locality"
                      className="w-full bg-transparent text-sm outline-none md:text-base"
                    />
                  </motion.div>
                  <motion.button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-rose-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 sm:rounded-[20px] sm:py-4 md:text-base"
                    whileHover={{
                      y: -3,
                      scale: 1.02,
                      backgroundColor: "#e11d48",
                      boxShadow: "0 18px 40px -20px rgba(225, 29, 72, 0.95)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Search className="h-4 w-4" />
                    Find Rooms
                  </motion.button>
                </motion.form>

                <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2.5 text-xs text-slate-100 sm:mt-6 sm:gap-3 sm:text-sm">
                  {[
                    "Tenant-first chat flow",
                    "Smooth property discovery",
                    "Manual locality support for hosts",
                  ].map((tag) => (
                    <motion.span
                      key={tag}
                      whileHover={{
                        y: -2,
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: "#ffffff",
                      }}
                      className="rounded-full bg-white/10 px-3 py-2 backdrop-blur sm:px-4"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showEntryPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-start justify-center bg-[rgba(22,16,24,0.56)] p-3 pt-20 backdrop-blur-sm sm:items-center sm:p-4 sm:pt-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-3xl max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[26px] border border-rose-200/60 bg-[linear-gradient(135deg,_rgba(255,243,238,0.96)_0%,_rgba(255,226,216,0.98)_42%,_rgba(255,205,188,0.96)_100%)] p-4 text-black shadow-[0_30px_90px_-30px_rgba(15,23,42,0.48)] md:p-6"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex rounded-full bg-white/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-600 shadow-sm md:text-[11px]">
                      Chennai rental flow
                    </span>
                    <h2 className="mt-3 text-xl font-bold leading-tight md:text-2xl lg:text-3xl">
                      Continue as host or tenant
                    </h2>
                    <p className="mt-2.5 max-w-xl text-sm leading-6 text-neutral-800 md:text-[15px]">
                      Continue as a tenant to browse rooms in Chennai, or continue as a host to publish your room with images, contact details, and pricing.
                    </p>
                  </div>

                  <button
                    onClick={closeEntryPopup}
                    aria-label="Close role chooser"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-300/80 bg-white/30 text-neutral-900 transition hover:bg-white/55"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    onClick={continueAsHost}
                    className="rounded-[22px] border border-rose-200 bg-[rgba(255,255,255,0.76)] p-4 text-left shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(225,29,72,0.28)] md:p-5"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <i className="fas fa-house-user text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-black md:text-xl">
                      Continue as Host
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-800">
                      Upload a Chennai room, add images, enter the required price and contact details, and publish your listing instantly.
                    </p>
                  </button>

                  <button
                    onClick={continueAsTenant}
                    className="rounded-[22px] border border-sky-200 bg-[rgba(255,255,255,0.76)] p-4 text-left shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(14,165,233,0.28)] md:p-5"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                      <User className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-black md:text-xl">
                      Continue as Tenant
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-800">
                      Browse rooms available in Chennai only, open the host contact and chat screen directly, and discuss details with the host.
                    </p>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-4 py-16"
      >
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <motion.div variants={fadeUp}>
            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
              Popular localities
            </span>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 md:text-4xl">
              Start with the areas tenants search most
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/listings?location=Chennai"
                className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
              >
                Browse all listings
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredAreas.map((area) => (
            <motion.div key={area.name} variants={fadeUp}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Link
                  to={`/listings?location=${encodeURIComponent(area.name)}`}
                  className="group block overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] transition"
                >
                  <div className="relative h-72 overflow-hidden">
                    <motion.img
                      src={area.image}
                      alt={area.name}
                      className="h-full w-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
                      whileHover={{
                        background:
                          "linear-gradient(to top, rgba(225,29,72,0.72), rgba(15,23,42,0.22), rgba(14,165,233,0.16))",
                      }}
                    />
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <h3 className="text-2xl font-semibold">{area.name}</h3>
                      <p className="mt-2 text-sm text-slate-200">{area.note}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        variants={staggerContainer}
        className={`py-16 ${theme === "dark" ? "bg-black" : "bg-neutral-50/80"}`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <motion.div variants={fadeUp} className="mb-8 max-w-2xl">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${theme === "dark" ? "bg-black text-white" : "bg-sky-50 text-sky-700"}`}>
              Platform focus
            </span>
            <h2 className={`mt-3 text-3xl font-bold md:text-4xl ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
              Cleaner experience for local room discovery
            </h2>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {quickHighlights.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                whileHover={{
                  y: -6,
                  ...(theme === "dark"
                    ? {
                        backgroundColor: "#000000",
                        borderColor: "rgba(248, 113, 113, 0.92)",
                        boxShadow:
                          "0 0 0 1px rgba(248,113,113,0.38), 0 28px 60px -32px rgba(239, 68, 68, 0.28)",
                      }
                    : {
                        backgroundColor: "#fff3eb",
                        borderColor: "#fb7185",
                        boxShadow: "0 28px 60px -32px rgba(225, 29, 72, 0.22)",
                      }),
                }}
                className={`rounded-[28px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)] ${
                  theme === "dark" ? "border-red-400/40 bg-black" : "border-white/70 bg-white"
                }`}
              >
                <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{item.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{
              y: -4,
              boxShadow: "0 30px 70px -36px rgba(15, 23, 42, 0.24)",
            }}
            className={`mt-8 rounded-[30px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] md:p-8 ${
              theme === "dark"
                ? "border-red-400/40 bg-black"
                : "border-rose-100 bg-[linear-gradient(135deg,_#fff1f2_0%,_#ffffff_55%,_#eff6ff_100%)]"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Ready to publish your room?</h3>
                <p className={`mt-3 text-sm leading-6 md:text-base ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                  Add your locality manually, upload room photos, set monthly rent, and make the listing visible right away.
                </p>
                <div className={`mt-4 flex flex-wrap gap-2 text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                  {CHENNAI_AREAS.slice(0, 6).map((area) => (
                    <motion.span
                      key={area}
                      whileHover={{
                        y: -2,
                        ...(theme === "dark"
                          ? {
                              backgroundColor: "#000000",
                              borderColor: "rgba(248,113,113,0.88)",
                              color: "#ffffff",
                            }
                          : {
                              backgroundColor: "#ffe4e6",
                              color: "#000000",
                            }),
                      }}
                      className={`rounded-full px-3 py-1.5 shadow-sm ${theme === "dark" ? "bg-black text-white border border-red-400/30" : "bg-white"}`}
                    >
                      {area}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/host/become-a-host"
                    className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Become a Host
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/listings?location=Chennai"
                    className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                      theme === "dark"
                        ? "border-red-400/40 bg-black text-white hover:border-red-300"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:text-primary-700"
                    }`}
                  >
                    Explore Rooms
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;

