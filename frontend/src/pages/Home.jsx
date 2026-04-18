import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CHENNAI_AREAS } from "../utils/chennaiListings";
import { useAppSettings } from "../contexts/AppSettingsContext";

const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1950&q=80",
    alt: "Comfortable room interior",
  },
  {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1950&q=80",
    alt: "Modern hostel room",
  },
  {
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1950&q=80",
    alt: "Bright shared room",
  },
];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
      setTimeout(() => setIsTransitioning(false), 650);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 650);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 650);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextLocation = searchQuery.trim();
    navigate(
      nextLocation
        ? `/listings?location=${encodeURIComponent(nextLocation)}`
        : "/listings"
    );
  };

  return (
    <div
      className={`transition-colors duration-500 ${
        theme === "dark"
          ? "bg-[linear-gradient(180deg,_#000000_0%,_#050505_38%,_#090909_100%)]"
          : "bg-[linear-gradient(180deg,_#ffe0d2_0%,_#ffedd5_24%,_#ffc7b6_62%,_#fff1e6_100%)]"
      }`}
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_28%)]" />
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

        <div className="relative h-[640px] overflow-hidden">
          {heroImages.map((image, index) => (
            <motion.div
              key={image.alt}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
              animate={{
                scale: index === currentIndex ? 1.04 : 1,
              }}
              transition={{ duration: 3.2, ease: "easeOut" }}
            >
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.78)_0%,_rgba(15,23,42,0.56)_42%,_rgba(15,23,42,0.34)_100%)]" />
            </motion.div>
          ))}

          <div className="absolute inset-0">
            <div className="container mx-auto flex h-full items-center px-4">
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
                  className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-rose-100 backdrop-blur"
                >
                  Smart Rent System
                </motion.span>
                <motion.h1
                  variants={headlineContainer}
                  initial="hidden"
                  animate="show"
                  className="mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl"
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
                  className="mt-5 min-h-[84px] max-w-3xl rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur transition duration-500"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`quote-${currentIndex}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <motion.p
                        animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="bg-gradient-to-r from-rose-200 via-white to-sky-200 bg-[length:200%_100%] bg-clip-text text-lg font-semibold text-transparent md:text-2xl"
                      >
                        {heroQuotes[currentIndex].lineOne}
                      </motion.p>
                      <p className="mt-1 text-sm leading-6 text-slate-200 md:text-base">
                        {heroQuotes[currentIndex].lineTwo}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                <motion.form
                  variants={fadeUp}
                  onSubmit={handleSearchSubmit}
                  className="mt-8 flex max-w-2xl flex-col gap-3 rounded-[28px] border border-white/15 bg-white/12 p-3 backdrop-blur-md md:flex-row"
                >
                  <motion.div
                    whileHover={{ backgroundColor: "#fff7f8" }}
                    className="flex flex-1 items-center gap-3 rounded-[20px] bg-white px-4 py-4 text-neutral-700"
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
                    className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-rose-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-600 md:text-base"
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

                <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3 text-sm text-slate-100">
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
                      className="rounded-full bg-white/10 px-4 py-2 backdrop-blur"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {heroImages.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex ? "h-2 w-9 bg-white" : "h-2 w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.92 }}
              />
            ))}
          </div>
        </div>
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
