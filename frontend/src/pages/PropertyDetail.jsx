import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../config/api";
import PropertyImage from "../components/PropertyImage";
import StaticMap from "../components/StaticMap";
import dummyProperties from "../data/dummyProperties";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { getStoredHostListings, isChennaiProperty } from "../utils/chennaiListings";

const DETAIL_IMAGE_FALLBACKS = {
  room: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  ],
  pg: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  ],
  hostel: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  ],
};

const normalizeImageValue = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image.trim() || null;
  const url = image.url || image.secure_url || "";
  return url.trim() || null;
};

const buildDetailGalleryImages = (property) => {
  const propertyType = (property?.propertyType || property?.category || "room").toLowerCase();
  const fallbackPool =
    DETAIL_IMAGE_FALLBACKS[propertyType] || DETAIL_IMAGE_FALLBACKS.room;

  const primaryImages = Array.isArray(property?.images)
    ? property.images.map(normalizeImageValue).filter(Boolean)
    : [];

  const gallery = [...primaryImages];

  fallbackPool.forEach((fallbackImage) => {
    if (gallery.length >= 5) return;
    gallery.push(fallbackImage);
  });

  return gallery.length ? gallery : DETAIL_IMAGE_FALLBACKS.room;
};

const hostFromProperty = (property) => {
  const owner = property?.owner || property?.host || {};
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  return {
    id: owner._id || null,
    name: name || owner.username || owner.name || "Verified host",
    phone: owner.phone || "",
    profileImage: owner.profileImage || "",
    bio: owner.bio || "",
  };
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { formatPrice, theme } = useAppSettings();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaved, setIsSaved] = useState(false);
  const [reservation, setReservation] = useState({ checkIn: "", checkOut: "", guests: 1 });
  const [fallbackHost, setFallbackHost] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        const localHostProperty = getStoredHostListings().find(
          (item) => String(item._id) === String(id)
        );
        const fallback =
          localHostProperty ||
          dummyProperties.find((item) => String(item._id) === String(id));
        if (fallback) {
          if (isChennaiProperty(fallback)) {
            setProperty(fallback);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const checkSaved = async () => {
      if (!currentUser || !property?._id) return;
      try {
        const res = await api.get("/api/wishlist");
        setIsSaved(res.data.some((item) => String(item._id) === String(property._id)));
      } catch (err) {
        console.error(err);
      }
    };
    checkSaved();
  }, [currentUser, property?._id]);

  const host = useMemo(() => hostFromProperty(property), [property]);
  const resolvedHost = host.id ? host : fallbackHost || host;
  const images = useMemo(() => buildDetailGalleryImages(property), [property]);
  const nights = useMemo(() => {
    if (!reservation.checkIn || !reservation.checkOut) return 0;
    const diff = (new Date(reservation.checkOut) - new Date(reservation.checkIn)) / 86400000;
    return diff > 0 ? diff : 1;
  }, [reservation]);

  useEffect(() => {
    if (!property || host.id) {
      setFallbackHost(null);
      return;
    }

    let cancelled = false;

    const loadFallbackHost = async () => {
      try {
        const response = await api.get("/api/users/demo-host");
        if (!cancelled && response.data?._id) {
          setFallbackHost({
            id: response.data._id,
            name:
              [response.data.firstName, response.data.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || response.data.username || "Verified host",
            phone: response.data.phone || "",
            profileImage: response.data.profileImage || "",
            bio: "Contact the host directly to discuss rent, move-in timing, and room details.",
          });
        }
      } catch (err) {
        console.error("Unable to load fallback host", err);
      }
    };

    loadFallbackHost();

    return () => {
      cancelled = true;
    };
  }, [host.id, property]);

  const handleSave = async () => {
    if (!currentUser) return navigate("/login");
    try {
      await api.post(`/api/wishlist/${property._id}`, {});
      setIsSaved((prev) => !prev);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = () => {
    if (!currentUser) return navigate("/login");
    if (currentUser.role === "host") return;
    if (resolvedHost.id) {
      if (property.source === "local-host") {
        navigate(`/messages?receiver=${resolvedHost.id}`);
      } else {
        navigate(`/messages?property=${property._id}&receiver=${resolvedHost.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen py-20 text-center ${theme === "dark" ? "bg-black text-white" : "bg-neutral-50 text-neutral-600"}`}>
        Loading Property Details...
      </div>
    );
  }
  if (error || !property) {
    return (
      <div className={`min-h-screen py-20 text-center ${theme === "dark" ? "bg-black text-white" : "bg-neutral-50 text-neutral-600"}`}>
        Property not found.
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_transparent_28%),linear-gradient(180deg,_#fff8f1_0%,_#f8fafc_44%,_#ffffff_100%)] text-black"
      }`}
    >
      <div className="container mx-auto px-4">
        <Link
          to="/"
          onClick={() => window.history.back()}
          className={`mb-6 inline-flex items-center ${theme === "dark" ? "text-white hover:text-red-300" : "text-neutral-600 hover:text-primary-600"}`}
        >
          <i className="fas fa-arrow-left mr-2" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-[30px] border p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] backdrop-blur md:p-7 ${
            theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white/85"
          }`}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>Host-ready</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-orange-700"}`}>Direct chat available</span>
          </div>
          <h1 className={`mb-2 text-3xl font-bold md:text-4xl ${theme === "dark" ? "text-white" : "text-neutral-800"}`}>{property.title}</h1>
          <div className={`flex flex-wrap items-center gap-3 ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
            <span><i className="fas fa-star mr-1 text-yellow-400" />{property.averageRating || property.rating || 4.8}</span>
            <span>&middot;</span>
            <span><i className={`fas fa-map-marker-alt mr-1 ${theme === "dark" ? "text-white" : "text-primary-600"}`} />{property.location?.locality || property.location?.city || "Location not specified"}</span>
            <div className="ml-auto flex gap-3">
              <button onClick={handleSave} className={`rounded-full px-3 py-1.5 ${isSaved ? "text-red-600" : theme === "dark" ? "text-white hover:text-red-300" : "text-neutral-600 hover:text-primary-600"}`}>
                <i className={`${isSaved ? "fas" : "far"} fa-heart mr-1`} />
                {isSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 overflow-hidden rounded-[30px] border shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] ${
            theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white"
          }`}
        >
          <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
            <div className="h-80 overflow-hidden rounded-t-xl md:h-96 md:rounded-bl-xl md:rounded-tl-xl">
              <PropertyImage images={images} alt={property.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" showGallery={true} id={`property-image-main-${property._id}`} propertyId={property._id} />
            </div>
            <div className="grid h-80 grid-cols-2 gap-2 md:h-96">
              {images.slice(1, 5).map((image, index) => (
                <div key={index} className={`overflow-hidden bg-neutral-100 ${index === 0 ? "md:rounded-tr-xl" : ""} ${index === 3 ? "md:rounded-br-xl" : ""}`}>
                  <PropertyImage image={image} images={images} alt={`${property.title} ${index + 2}`} className="h-full w-full object-cover" showGallery={true} id={`property-image-${index}-${property._id}`} propertyId={property._id} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-[28px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.24)] ${
                theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white"
              }`}
            >
              <div className={`mb-6 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-center md:justify-between ${theme === "dark" ? "border-red-400/30" : "border-neutral-100"}`}>
                <div>
                  <h2 className={`mb-1 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-neutral-800"}`}>{property.propertyType || property.category || "Room"} hosted by {resolvedHost.name}</h2>
                  <p className={theme === "dark" ? "text-white" : "text-neutral-600"}>{property.capacity?.guests || 4} guests &middot; {property.capacity?.bedrooms || 2} bedrooms &middot; {property.capacity?.bathrooms || 1} bathrooms</p>
                  <p className={`mt-3 max-w-2xl text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>{resolvedHost.bio || "Contact the host directly to discuss rent, advance payment, amenities, and move-in details."}</p>
                </div>
                {resolvedHost.profileImage ? <img src={resolvedHost.profileImage} alt={resolvedHost.name} className="h-14 w-14 rounded-full object-cover" /> : <div className={`flex h-14 w-14 items-center justify-center rounded-full ${theme === "dark" ? "bg-black text-white" : "bg-neutral-100 text-neutral-400"}`}><i className="fas fa-user text-2xl" /></div>}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className={`rounded-2xl px-4 py-4 text-sm ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-neutral-700"}`}>Quick host response for rent and availability.</div>
                <div className={`rounded-2xl px-4 py-4 text-sm ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-neutral-700"}`}>Tenant-host negotiation ready chat flow.</div>
                <div className={`rounded-2xl px-4 py-4 text-sm ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-neutral-700"}`}>{property.location?.locality || property.location?.city || "Prime locality"} with better connectivity.</div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {resolvedHost.phone && <a href={`tel:${resolvedHost.phone}`} className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium ${theme === "dark" ? "border-red-400/50 bg-black text-white hover:border-red-300" : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:text-primary-700"}`}><i className="fas fa-phone-alt mr-2" />{resolvedHost.phone}</a>}
                <button onClick={handleChat} disabled={!resolvedHost.id || currentUser?.role === "host"} className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"><i className="fas fa-comments mr-2" />{currentUser?.role === "host" ? "Host Inbox Only" : "Chat with Host"}</button>
              </div>

              <div className={`mt-6 overflow-hidden rounded-[28px] border ${theme === "dark" ? "border-red-400/40 bg-black" : "border-neutral-200 bg-neutral-50/70"}`}>
                <div className={`border-b px-5 py-4 ${theme === "dark" ? "border-red-400/30" : "border-neutral-200"}`}>
                  <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Area geolocation</h3>
                  <p className={`mt-1 text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                    {property.location?.address || property.location?.locality || property.location?.city
                      ? [property.location?.address, property.location?.locality, property.location?.city, property.location?.state, property.location?.country]
                          .filter(Boolean)
                          .join(", ")
                      : "Location details not available"}
                  </p>
                </div>
                <div className="h-[280px] overflow-hidden">
                  <StaticMap
                    address={property.location?.address}
                    city={property.location?.city}
                    state={property.location?.state}
                    country={property.location?.country}
                    coordinates={property.location?.coordinates}
                    isConfirmedBooking={true}
                    zoom={14}
                  />
                </div>
              </div>
            </motion.div>

            <div className={`mb-6 overflow-hidden rounded-[28px] border shadow-[0_24px_60px_-34px_rgba(15,23,42,0.24)] ${theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white"}`}>
              <div className={`flex flex-wrap border-b ${theme === "dark" ? "border-red-400/30" : "border-neutral-200"}`}>
                {["overview", "amenities", "location"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-red-500 text-red-500" : theme === "dark" ? "text-white" : "text-neutral-600"}`}>{tab}</button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === "overview" && <div className="space-y-4"><p className={`leading-relaxed ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>{property.description}</p><p className={theme === "dark" ? "text-white" : "text-neutral-600"}>{property.propertyType || "Room"} &middot; {property.size || 100} sq ft &middot; {property.capacity?.beds || 2} beds</p></div>}
                {activeTab === "amenities" && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{[["wifi", "WiFi"], ["kitchen", "Kitchen"], ["parking", "Parking"], ["ac", "Air conditioning"], ["washer", "Washer"], ["workspace", "Workspace"]].filter(([key]) => property.amenities?.[key]).map(([key, label]) => <div key={key} className={`flex items-center ${theme === "dark" ? "text-white" : "text-neutral-700"}`}><i className={`fas fa-check mr-3 ${theme === "dark" ? "text-white" : "text-primary-600"}`} />{label}</div>)}</div>}
                {activeTab === "location" && <div><p className={`mb-4 ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>{property.location?.city ? `${property.location.city}, ${property.location.state || ""}, ${property.location.country || ""}` : "Location details not available"}</p><div className="h-[340px] overflow-hidden rounded-2xl"><StaticMap address={property.location?.address} city={property.location?.city} state={property.location?.state} country={property.location?.country} coordinates={property.location?.coordinates} isConfirmedBooking={true} zoom={13} /></div></div>}
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <div className={`sticky top-24 rounded-[28px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.24)] ${theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white"}`}>
              <div className="mb-4 flex items-start justify-between">
                <div><span className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-neutral-800"}`}>{formatPrice(property.price || 100)}</span><span className={theme === "dark" ? "text-white" : "text-neutral-600"}> / month</span></div>
                <div className={`text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}><i className="fas fa-star mr-1 text-yellow-400" />{property.averageRating || property.rating || 4.8}</div>
              </div>
              <div className={`mb-4 rounded-2xl px-4 py-3 text-sm leading-6 ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-orange-700"}`}>Interested in this room? Open a direct chat with the host to discuss rent and move-in details.</div>
              <div className={`mb-4 overflow-hidden rounded-2xl border ${theme === "dark" ? "border-red-400/40" : "border-neutral-200"}`}>
                <div className="grid grid-cols-2">
                  <div className={`border-b border-r p-4 ${theme === "dark" ? "border-red-400/30" : "border-neutral-200"}`}><label className={`mb-1 block text-xs font-medium ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>CHECK-IN</label><input type="date" value={reservation.checkIn} onChange={(e) => setReservation((prev) => ({ ...prev, checkIn: e.target.value }))} className={`w-full border-none bg-transparent p-0 ${theme === "dark" ? "text-white" : "text-neutral-800"} focus:ring-0`} /></div>
                  <div className={`border-b p-4 ${theme === "dark" ? "border-red-400/30" : "border-neutral-200"}`}><label className={`mb-1 block text-xs font-medium ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>CHECKOUT</label><input type="date" value={reservation.checkOut} onChange={(e) => setReservation((prev) => ({ ...prev, checkOut: e.target.value }))} className={`w-full border-none bg-transparent p-0 ${theme === "dark" ? "text-white" : "text-neutral-800"} focus:ring-0`} /></div>
                </div>
                <div className="p-4"><label className={`mb-1 block text-xs font-medium ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>GUESTS</label><select value={reservation.guests} onChange={(e) => setReservation((prev) => ({ ...prev, guests: Number(e.target.value) }))} className={`w-full border-none bg-transparent p-0 ${theme === "dark" ? "text-white" : "text-neutral-800"} focus:ring-0`}>{[1, 2, 3, 4, 5, 6].map((guest) => <option key={guest} value={guest}>{guest} guest{guest > 1 ? "s" : ""}</option>)}</select></div>
              </div>
              <button onClick={() => (currentUser ? navigate("/payment", { state: { propertyId: property._id, property } }) : navigate("/login"))} className="mb-4 w-full rounded-lg bg-red-600 py-3 font-medium text-white hover:bg-red-700">Reserve</button>
              <button onClick={handleChat} disabled={!resolvedHost.id || currentUser?.role === "host"} className={`mb-4 w-full rounded-lg border py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${theme === "dark" ? "border-red-400/40 bg-black text-white hover:border-red-300" : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:text-primary-700"}`}><i className="fas fa-comments mr-2" />{currentUser?.role === "host" ? "Host Inbox Only" : "Chat Host Now"}</button>
              <div className={`space-y-3 text-sm ${theme === "dark" ? "text-white" : "text-neutral-700"}`}>
                <div className="flex justify-between"><span>{formatPrice(property.price || 100)} x {nights} night{nights !== 1 ? "s" : ""}</span><span>{formatPrice((property.price || 100) * nights)}</span></div>
                <div className="flex justify-between"><span>Cleaning fee</span><span>{formatPrice(60)}</span></div>
                <div className="flex justify-between"><span>Service fee</span><span>{formatPrice(75)}</span></div>
                <div className={`flex justify-between border-t pt-3 font-semibold ${theme === "dark" ? "border-red-400/30" : "border-neutral-200"}`}><span>Total before taxes</span><span>{formatPrice((property.price || 100) * nights + 135)}</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
