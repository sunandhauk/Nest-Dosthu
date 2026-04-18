import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import PropertyImage from "../components/PropertyImage";
import dummyProperties from "../data/dummyProperties";
import {
  CHENNAI_AREAS,
  CHENNAI_CITY,
  getStoredHostListings,
  isChennaiProperty,
} from "../utils/chennaiListings";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";

const categories = [
  { id: "all", label: "All" },
  { id: "PG", label: "PG" },
  { id: "Hostel", label: "Hostel" },
  { id: "Room", label: "Room" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: index * 0.06 },
  }),
};

const getHostName = (property) => {
  const owner = property.owner || property.host;
  if (!owner) return "Verified host";
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  return fullName || owner.username || owner.name || "Verified host";
};

const Listings = () => {
  const { currentUser } = useAuth();
  const { theme } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: CHENNAI_CITY,
    priceMin: "",
    priceMax: "",
  });
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const rawLocation = queryParams.get("location") || CHENNAI_CITY;
    const searchValue = rawLocation.toLowerCase().trim();

    const localHostListings = getStoredHostListings();
    const mergedProperties = [...dummyProperties.filter(isChennaiProperty), ...localHostListings];

    const filtered = mergedProperties.filter((property) => {
      const city = property.location?.city?.toLowerCase() || "";
      const locality = property.location?.locality?.toLowerCase() || "";
      const title = property.title?.toLowerCase() || "";
      const description = property.description?.toLowerCase() || "";
      const category = property.category?.toLowerCase() || "";
      const propertyType = property.propertyType?.toLowerCase() || "";

      if (city !== CHENNAI_CITY.toLowerCase()) {
        return false;
      }

      if (!searchValue || searchValue === CHENNAI_CITY.toLowerCase()) {
        return true;
      }

      return (
        locality.includes(searchValue) ||
        title.includes(searchValue) ||
        description.includes(searchValue) ||
        category.includes(searchValue) ||
        propertyType.includes(searchValue)
      );
    });

    setProperties(filtered);
    setFilters((prev) => ({
      ...prev,
      location: rawLocation,
    }));
    setLoading(false);
  }, [location.search]);

  const displayedProperties = useMemo(() => {
    return properties.filter((property) => {
      if (
        activeCategory !== "all" &&
        (property.category || property.propertyType || "").toLowerCase() !== activeCategory.toLowerCase()
      ) {
        return false;
      }

      const searchableText = [
        property.location?.city || "",
        property.location?.locality || "",
        property.title || "",
      ]
        .join(" ")
        .toLowerCase();

      if (filters.location && !searchableText.includes(filters.location.toLowerCase())) {
        return false;
      }

      if (filters.priceMin && Number(property.price) < Number(filters.priceMin)) return false;
      if (filters.priceMax && Number(property.price) > Number(filters.priceMax)) return false;

      return true;
    });
  }, [activeCategory, filters.location, filters.priceMax, filters.priceMin, properties]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      location: CHENNAI_CITY,
      priceMin: "",
      priceMax: "",
    });
    setActiveCategory("all");
    navigate("/listings?location=Chennai");
  };

  const navigateToPropertyDetail = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  const navigateToChat = (event, property) => {
    event.stopPropagation();

    if (currentUser?.role === "host") {
      return;
    }

    if (property.owner?._id) {
      if (property.source === "local-host") {
        navigate(`/messages?receiver=${property.owner._id}`);
      } else {
        navigate(`/messages?property=${property._id}&receiver=${property.owner._id}`);
      }
      return;
    }

    navigate(`/properties/${property._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
          <p className="text-lg text-neutral-600">Loading Chennai properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_transparent_28%),linear-gradient(180deg,_#fff8f1_0%,_#fff1e6_44%,_#ffffff_100%)] text-black"
      }`}
    >
      <div
        className={`sticky top-[72px] z-10 border-b backdrop-blur-xl ${
          theme === "dark"
            ? "border-red-400/40 bg-black/95"
            : "border-orange-200/70 bg-white/80"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition duration-300 ${
                    activeCategory === category.id
                      ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-200"
                      : theme === "dark"
                        ? "border-red-400/50 bg-black text-white hover:-translate-y-0.5 hover:border-red-300"
                        : "border-orange-200 bg-white text-black hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <button
              onClick={clearAllFilters}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                theme === "dark"
                  ? "border-red-400/50 bg-black text-white hover:border-red-300"
                  : "border-orange-200 bg-white text-black hover:border-orange-300 hover:text-orange-700"
              }`}
            >
              Reset Chennai Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`mb-8 overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] backdrop-blur md:p-7 ${
            theme === "dark"
              ? "border-red-400/50 bg-black"
              : "border-orange-200/70 bg-white/85"
          }`}
        >
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                  theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"
                }`}
              >
                Chennai only
              </span>
              <h1 className={`mt-3 text-3xl font-bold md:text-4xl ${theme === "dark" ? "text-white" : "text-black"}`}>
                Chennai rooms and hostels only
              </h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 md:text-base ${theme === "dark" ? "text-white" : "text-gray-700"}`}>
                Only rooms, PGs, and hostels located in Chennai are shown here. Newly published host listings also appear here automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-black"}`}>
                <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-orange-700"}`}>{displayedProperties.length}</p>
                <p>Chennai matches</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-black"}`}>
                <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-orange-700"}`}>{CHENNAI_AREAS.length}</p>
                <p>Focus localities</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Search Chennai area"
              list="chennai-filter-areas"
              className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
                theme === "dark"
                  ? "border-red-400/50 bg-black text-white focus:border-red-300 focus:ring-4 focus:ring-red-500/20"
                  : "border-orange-200 bg-white text-black focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              }`}
            />
            <datalist id="chennai-filter-areas">
              <option value={CHENNAI_CITY} />
              {CHENNAI_AREAS.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
            <input
              type="number"
              name="priceMin"
              value={filters.priceMin}
              onChange={handleFilterChange}
              placeholder="Min monthly price"
              className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
                theme === "dark"
                  ? "border-red-400/50 bg-black text-white focus:border-red-300 focus:ring-4 focus:ring-red-500/20"
                  : "border-orange-200 bg-white text-black focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              }`}
            />
            <input
              type="number"
              name="priceMax"
              value={filters.priceMax}
              onChange={handleFilterChange}
              placeholder="Max monthly price"
              className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${
                theme === "dark"
                  ? "border-red-400/50 bg-black text-white focus:border-red-300 focus:ring-4 focus:ring-red-500/20"
                  : "border-orange-200 bg-white text-black focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              }`}
            />
          </div>
        </motion.section>

        {displayedProperties.length === 0 ? (
          <div
            className={`rounded-[28px] border py-16 text-center shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] backdrop-blur ${
              theme === "dark"
                ? "border-red-400/50 bg-black text-white"
                : "border-orange-200/70 bg-white/85 text-black"
            }`}
          >
            <div className={`mb-4 text-5xl ${theme === "dark" ? "text-white" : "text-neutral-300"}`}>
              <i className="fas fa-search" />
            </div>
            <h3 className={`mb-2 text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-neutral-800"}`}>No Chennai properties found</h3>
            <p className={`mb-6 ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>Try areas such as Adyar, Velachery, Vadapalani, or Tambaram.</p>
            <button
              onClick={clearAllFilters}
              className="rounded-xl bg-red-600 px-5 py-3 text-white transition hover:bg-red-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {displayedProperties.map((property, index) => {
              const propertyImages =
                Array.isArray(property.images) && property.images.length > 0
                  ? property.images
                  : ["/images/default-property.jpg"];

              return (
                <motion.div
                  key={property._id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -8 }}
                  className={`group cursor-pointer overflow-hidden rounded-[30px] border shadow-[0_24px_60px_-34px_rgba(15,23,42,0.33)] backdrop-blur ${
                    theme === "dark"
                      ? "border-red-400/50 bg-black text-white"
                      : "border-orange-200/70 bg-white/90 text-black"
                  }`}
                  onClick={() => navigateToPropertyDetail(property._id)}
                >
                  <div className="relative h-64 overflow-hidden md:h-72">
                    <PropertyImage
                      images={propertyImages}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      showGallery={true}
                      id={`property-image-${property._id}`}
                      propertyId={property._id}
                    />
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" />
                    <span
                      className={`absolute right-4 top-4 rounded-full px-4 py-2 text-base font-bold shadow-lg ${
                        theme === "dark" ? "bg-black text-white" : "bg-white text-orange-700"
                      }`}
                    >
                      Rs.{property.price}/month
                    </span>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      {property.location?.locality || CHENNAI_CITY}
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-xl font-semibold md:text-2xl ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{property.title}</h3>
                        <p className={`mt-1 text-sm ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>Hosted by {getHostName(property)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                        <i className="fas fa-star mr-1" />
                        {property.rating || property.averageRating || 4.5}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                        {property.propertyType || property.category}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-neutral-700"}`}>
                        {property.source === "local-host" ? "New host listing" : "Verified listing"}
                      </span>
                    </div>

                    <p className={`mb-5 line-clamp-3 text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>{property.description}</p>

                    <div className={`mb-5 grid grid-cols-2 gap-3 text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                      <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black" : "bg-orange-50"}`}>
                        <i className={`fas fa-bed mr-2 ${theme === "dark" ? "text-white" : "text-orange-500"}`} />
                        {property.capacity?.bedrooms || 1} Beds
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black" : "bg-orange-50"}`}>
                        <i className={`fas fa-bath mr-2 ${theme === "dark" ? "text-white" : "text-orange-500"}`} />
                        {property.capacity?.bathrooms || 1} Baths
                      </div>
                    </div>

                    <div className={`mb-5 flex items-center justify-between gap-4 text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                      <span className="min-w-0 truncate">
                        <i className={`fas fa-map-marker-alt mr-2 ${theme === "dark" ? "text-white" : "text-orange-500"}`} />
                        {property.location?.locality || property.location?.city || CHENNAI_CITY}, Chennai
                      </span>
                      {(property.owner?.phone || property.host?.phone) && (
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                          {property.owner?.phone || property.host?.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigateToPropertyDetail(property._id);
                        }}
                        className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(event) => navigateToChat(event, property)}
                        disabled={currentUser?.role === "host"}
                        className={`flex-1 rounded-2xl border px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          theme === "dark"
                            ? "border-red-400/50 bg-black text-white hover:-translate-y-0.5 hover:border-red-300"
                            : "border-orange-200 bg-white text-black hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
                        }`}
                      >
                        <i className="fas fa-comments mr-2" />
                        {currentUser?.role === "host" ? "Host Inbox Only" : "Chat Host"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;
