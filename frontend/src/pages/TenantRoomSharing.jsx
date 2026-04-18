import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  createEmptyVacancyForm,
  getStoredTenantVacancies,
  normalizeVacancyListing,
  savePreferenceSnapshot,
  saveStoredTenantVacancies,
} from "../utils/tenantVacancies";
import {
  buildLocationIntelligence,
  buildRoommateMatch,
} from "../utils/roommateMatching";

const amenityOptions = [
  { key: "wifi", label: "Wi-Fi", icon: "fa-wifi" },
  { key: "attachedBathroom", label: "Attached bathroom", icon: "fa-bath" },
  { key: "ac", label: "AC", icon: "fa-snowflake" },
  { key: "nonAc", label: "Non-AC", icon: "fa-fan" },
  { key: "food", label: "Food availability", icon: "fa-utensils" },
  { key: "housekeeping", label: "Housekeeping", icon: "fa-broom" },
  { key: "parking", label: "Parking", icon: "fa-square-parking" },
];

const occupationOptions = ["Student", "Working Professional"];

const descriptionTemplate = `I am currently staying in a PG accommodation and looking for additional roommates. At present, one person is occupying the room, and there is availability for up to three members to share the same room.

We are looking for friendly and responsible individuals who are comfortable with shared living. Basic amenities such as Wi-Fi, attached bathroom, and regular housekeeping are available.

Preferences:

Clean and hygienic habits
Non-smoker (preferred)
Working professionals or students
Respectful of shared space and privacy

If you are interested in a comfortable and affordable shared accommodation, please feel free to contact me.`;

const defaultSeekerProfile = {
  name: "Rahul",
  budget: 8000,
  sleepSchedule: "Night owl",
  cleanliness: "Clean and hygienic habits",
  smoking: "Non-smoker preferred",
  interests: "gaming, movies, late-night tea",
  preferredLocations: "Tambaram, Velachery, flexible",
};

const TenantRoomSharing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [formData, setFormData] = useState(() => createEmptyVacancyForm(currentUser));
  const [seekerProfile, setSeekerProfile] = useState(defaultSeekerProfile);

  useEffect(() => {
    const storedVacancies = getStoredTenantVacancies();
    setVacancies(storedVacancies);
    if (storedVacancies[0]?.preferences) {
      savePreferenceSnapshot(storedVacancies[0].preferences);
    } else {
      savePreferenceSnapshot(formData.preferences);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentUser && !editingId) {
      setFormData((prev) => ({
        ...prev,
        contactNumber: prev.contactNumber || currentUser.phone || "",
      }));
    }
  }, [currentUser, editingId]);

  useEffect(() => {
    if (isLoaded) {
      savePreferenceSnapshot(formData.preferences);
    }
  }, [formData.preferences, isLoaded]);

  const stats = useMemo(() => {
    const openListings = vacancies.filter((listing) => listing.listingStatus === "Open");
    return {
      total: vacancies.length,
      open: openListings.length,
      full: vacancies.filter((listing) => listing.listingStatus === "Full").length,
      availableSlots: openListings.reduce(
        (sum, listing) => sum + Number(listing.availableSlots || 0),
        0
      ),
    };
  }, [vacancies]);

  const managedVacancies = useMemo(() => {
    if (!currentUser?._id) {
      return vacancies;
    }

    return vacancies.filter(
      (listing) => String(listing.ownerId || "") === String(currentUser._id)
    );
  }, [currentUser?._id, vacancies]);

  const liveRoommateMatch = useMemo(
    () => buildRoommateMatch(formData, seekerProfile),
    [formData, seekerProfile]
  );

  const liveLocationMatch = useMemo(
    () => buildLocationIntelligence(formData.location, seekerProfile.preferredLocations),
    [formData.location, seekerProfile.preferredLocations]
  );

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "currentOccupants" || name === "totalCapacity") {
        const currentOccupants =
          name === "currentOccupants" ? Number(value) : Number(prev.currentOccupants);
        const totalCapacity =
          name === "totalCapacity" ? Number(value) : Number(prev.totalCapacity);
        next.availableSlots = Math.max(totalCapacity - currentOccupants, 0);
      }

      if (name === "availableSlots") {
        next.availableSlots = Math.max(Number(value), 0);
      }

      return next;
    });
  };

  const handleAmenityToggle = (key) => {
    setFormData((prev) => {
      const nextAmenities = {
        ...prev.amenities,
        [key]: !prev.amenities[key],
      };

      if (key === "ac" && !prev.amenities[key]) {
        nextAmenities.nonAc = false;
      }

      if (key === "nonAc" && !prev.amenities[key]) {
        nextAmenities.ac = false;
      }

      return {
        ...prev,
        amenities: nextAmenities,
      };
    });
  };

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: value,
      },
    }));
  };

  const handleSeekerProfileChange = (event) => {
    const { name, value } = event.target;
    setSeekerProfile((prev) => ({
      ...prev,
      [name]: name === "budget" ? value.replace(/[^\d]/g, "") : value,
    }));
  };

  const toggleOccupation = (value) => {
    setFormData((prev) => {
      const current = prev.preferences.occupation || [];
      const nextOccupation = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          occupation: nextOccupation,
        },
      };
    });
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const readers = files.map(
      (file, index) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${index}`,
              name: file.name,
              url: reader.result,
            });
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((uploadedPhotos) => {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos].slice(0, 6),
      }));
    });
  };

  const removePhoto = (photoId) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId),
    }));
  };

  const resetForm = (options = {}) => {
    const { preserveFeedback = false } = options;
    setEditingId(null);
    if (!preserveFeedback) {
      setFeedback("");
    }
    setFormData(createEmptyVacancyForm(currentUser));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedListing = normalizeVacancyListing({
      ...formData,
      id: editingId || Date.now(),
      ownerId: currentUser?._id || formData.ownerId || "",
      ownerName:
        [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim() ||
        currentUser?.username ||
        formData.ownerName ||
        "Tenant",
      ownerRole: currentUser?.role || formData.ownerRole || "user",
      listingStatus: Number(formData.availableSlots) > 0 ? formData.listingStatus : "Full",
      createdAt:
        vacancies.find((listing) => listing.id === editingId)?.createdAt ||
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedVacancies = editingId
      ? vacancies.map((listing) =>
          listing.id === editingId ? normalizedListing : listing
        )
      : [normalizedListing, ...vacancies];

    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
    savePreferenceSnapshot(normalizedListing.preferences);
    setFeedback(
      editingId
        ? "Vacancy listing updated successfully."
        : "Vacancy listing posted successfully."
    );
    resetForm({ preserveFeedback: true });
  };

  const handleEdit = (listing) => {
    setEditingId(listing.id);
    setFeedback("");
    setFormData(normalizeVacancyListing(listing));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    const updatedVacancies = vacancies.filter((listing) => listing.id !== id);
    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
    if (updatedVacancies[0]?.preferences) {
      savePreferenceSnapshot(updatedVacancies[0].preferences);
    } else {
      savePreferenceSnapshot(createEmptyVacancyForm(currentUser).preferences);
    }
  };

  const handleStatusToggle = (id) => {
    const updatedVacancies = vacancies.map((listing) => {
      if (listing.id !== id) {
        return listing;
      }

      const nextStatus = listing.listingStatus === "Full" ? "Open" : "Full";
      return normalizeVacancyListing({
        ...listing,
        listingStatus: nextStatus,
        availableSlots: nextStatus === "Full" ? 0 : Math.max(listing.availableSlots, 1),
        updatedAt: new Date().toISOString(),
      });
    });

    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
  };

  const handleListingChat = (listing) => {
    if (!listing?.enableInAppChat) {
      return;
    }

    const isOwnListing =
      String(listing.ownerId || "") === String(currentUser?._id || "");

    if (isOwnListing) {
      navigate("/messages");
      return;
    }

    if (listing.ownerId) {
      navigate(`/messages?receiver=${listing.ownerId}`);
    }
  };

  if (!currentUser) {
    return null;
  }

  const shellClass =
    "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.36),transparent_28%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.18),transparent_26%),linear-gradient(180deg,#000000_0%,#050505_48%,#000000_100%)] py-8";
  const panelClass =
    "rounded-[32px] border border-red-500/80 bg-black p-6 text-white shadow-[0_24px_60px_-34px_rgba(239,68,68,0.5)] md:p-8";
  const heroPanelClass =
    "overflow-hidden rounded-[32px] border border-red-500/80 bg-black text-white shadow-[0_24px_60px_-34px_rgba(239,68,68,0.45)]";
  const textMutedClass = "text-sm text-white/70";
  const labelClass = "text-sm font-medium text-white";
  const inputClass =
    "mt-2 w-full rounded-2xl border border-red-500 bg-black px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-red-400 focus:outline-none";
  const chipClass =
    "rounded-full border border-red-500 bg-black px-4 py-2 text-white";
  const secondaryButtonClass =
    "rounded-2xl border border-red-500 bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600/12 hover:border-red-400";

  return (
    <div className={shellClass}>
      <div className="container mx-auto px-4">
        <section className={heroPanelClass}>
          <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div>
              <span className="inline-flex rounded-full border border-red-500 bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Tenant room sharing
              </span>
              <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
                Post room vacancies from your current stay and find the right roommate faster.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                Create a listing from your PG, hostel, or apartment, share available spots,
                and highlight the lifestyle preferences that matter for shared living.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className={chipClass}>
                  Current occupancy + open slots
                </span>
                <span className={chipClass}>
                  Roommate preferences
                </span>
                <span className={chipClass}>
                  Photos, contact controls, and status management
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/messages"
                  className="inline-flex items-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  <i className="fas fa-comments mr-2" />
                  Open Messages
                </Link>
                <Link
                  to="/account"
                  className={secondaryButtonClass}
                >
                  <i className="fas fa-user-circle mr-2" />
                  My Stay Settings
                </Link>
                <Link
                  to="/tenant/swipe-matching"
                  className={secondaryButtonClass}
                >
                  <i className="fas fa-fire mr-2" />
                  Smart Swipe Matches
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-red-500 bg-black p-5 text-white shadow-lg sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live summary</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-3xl font-semibold">{stats.total}</p>
                    <p className="text-sm text-white/70">Total listings</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.open}</p>
                    <p className="text-sm text-white/70">Open now</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.full}</p>
                    <p className="text-sm text-white/70">Marked full</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.availableSlots}</p>
                    <p className="text-sm text-white/70">Available slots</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-red-500 bg-black p-5">
                <p className="text-sm font-semibold text-white">User flow</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Login, create a vacancy listing, review preferences from the top menu,
                  and manage everything from one place.
                </p>
              </div>

              <div className="rounded-[28px] border border-red-500 bg-black p-5">
                <p className="text-sm font-semibold text-white">1. Smart Roommate Matching</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  Compatibility: {liveRoommateMatch.matchScore}%
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Reason: {seekerProfile.name} and your listing align because {liveRoommateMatch.reason}.
                </p>
                <Link
                  to="/tenant/swipe-matching"
                  className="mt-4 inline-flex items-center rounded-2xl border border-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600/12"
                >
                  Open swipe experience
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={panelClass}>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Edit vacancy listing" : "Create vacancy listing"}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Add room details, amenities, preferences, and contact visibility for your current stay.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    description: descriptionTemplate,
                  }))
                }
                className="rounded-2xl border border-red-500 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-red-400 hover:bg-red-600/12"
              >
                Use sample description
              </button>
            </div>

            {feedback && (
              <div className="mb-6 rounded-2xl border border-red-500 bg-black px-4 py-3 text-sm text-white">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white">Basic details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>
                    Property type
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleFieldChange}
                      className={inputClass}
                    >
                      <option>PG</option>
                      <option>Apartment</option>
                      <option>Hostel</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Room type
                    <select
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleFieldChange}
                      className={inputClass}
                    >
                      <option>Single</option>
                      <option>Double Sharing</option>
                      <option>Triple Sharing</option>
                    </select>
                  </label>

                  <label className={`${labelClass} md:col-span-2`}>
                    Location
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFieldChange}
                      placeholder="Area, city, landmark"
                      className={inputClass}
                      required
                    />
                  </label>

                  <label className={labelClass}>
                    Rent per person
                    <input
                      type="number"
                      min="0"
                      name="rentPerPerson"
                      value={formData.rentPerPerson}
                      onChange={handleFieldChange}
                      placeholder="5000"
                      className={inputClass}
                      required
                    />
                  </label>

                  <label className={labelClass}>
                    Listing status
                    <select
                      name="listingStatus"
                      value={formData.listingStatus}
                      onChange={handleFieldChange}
                      className={inputClass}
                    >
                      <option>Open</option>
                      <option>Full</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Occupancy details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className={labelClass}>
                    Current occupants
                    <input
                      type="number"
                      min="0"
                      name="currentOccupants"
                      value={formData.currentOccupants}
                      onChange={handleFieldChange}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Total room capacity
                    <input
                      type="number"
                      min="1"
                      name="totalCapacity"
                      value={formData.totalCapacity}
                      onChange={handleFieldChange}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Available slots
                    <input
                      type="number"
                      min="0"
                      name="availableSlots"
                      value={formData.availableSlots}
                      onChange={handleFieldChange}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Amenities</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity.key}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity.key)}
                      className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                        formData.amenities[amenity.key]
                          ? "border-red-500 bg-red-600/15 text-white"
                          : "border-red-500 bg-black text-white hover:border-red-400"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <i className={`fas ${amenity.icon} text-base`} />
                        <span className="text-sm font-medium">{amenity.label}</span>
                      </span>
                      <i
                        className={`fas ${
                          formData.amenities[amenity.key] ? "fa-check-circle" : "fa-circle"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Preferences</h3>
                    <p className="mt-1 text-sm text-white/60">
                      These details power the top-menu Preferences view.
                    </p>
                  </div>
                  <span className="rounded-full border border-red-500 bg-black px-3 py-1 text-xs font-semibold text-white">
                    Hidden by default in navbar
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>
                    Gender preference
                    <select
                      name="gender"
                      value={formData.preferences.gender}
                      onChange={handlePreferenceChange}
                      className={inputClass}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Any</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Sleep schedule
                    <input
                      type="text"
                      name="sleepSchedule"
                      value={formData.preferences.sleepSchedule}
                      onChange={handlePreferenceChange}
                      placeholder="Early sleeper, night owl, flexible"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Smoking habits
                    <select
                      name="smoking"
                      value={formData.preferences.smoking}
                      onChange={handlePreferenceChange}
                      className={inputClass}
                    >
                      <option>Non-smoker preferred</option>
                      <option>No preference</option>
                      <option>Smoker okay</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Drinking habits
                    <select
                      name="drinking"
                      value={formData.preferences.drinking}
                      onChange={handlePreferenceChange}
                      className={inputClass}
                    >
                      <option>No preference</option>
                      <option>Non-drinker preferred</option>
                      <option>Social drinking okay</option>
                    </select>
                  </label>

                  <label className={`${labelClass} md:col-span-2`}>
                    Cleanliness expectations
                    <input
                      type="text"
                      name="cleanliness"
                      value={formData.preferences.cleanliness}
                      onChange={handlePreferenceChange}
                      placeholder="Clean and hygienic habits"
                      className={inputClass}
                    />
                  </label>

                  <label className={`${labelClass} md:col-span-2`}>
                    Interests
                    <input
                      type="text"
                      name="interests"
                      value={formData.preferences.interests}
                      onChange={handlePreferenceChange}
                      placeholder="Gaming, fitness, movies, cooking"
                      className={inputClass}
                    />
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-white">Occupation preference</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {occupationOptions.map((option) => {
                        const isSelected = formData.preferences.occupation.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOccupation(option)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "border border-red-500 bg-red-600 text-white"
                                : "border border-red-500 bg-black text-white hover:bg-red-600/12"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className={`${labelClass} md:col-span-2`}>
                    Other roommate preferences
                    <textarea
                      name="other"
                      value={formData.preferences.other}
                      onChange={handlePreferenceChange}
                      rows="3"
                      placeholder="Respectful of shared space, quiet calls after 10 PM, etc."
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Description</h3>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  rows="8"
                  className={`${inputClass} min-h-[180px] py-4 leading-7`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Media upload</h3>
                <div className="mt-4 rounded-[24px] border border-dashed border-red-500 bg-black p-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-red-500 bg-black px-4 py-8 text-center transition hover:bg-red-600/12">
                    <i className="fas fa-images text-2xl text-red-400" />
                    <span className="mt-3 text-sm font-semibold text-white">
                      Upload room or property photos
                    </span>
                    <span className="mt-1 text-xs text-white/60">
                      Up to 6 images. Stored locally for now.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  {formData.photos.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-[20px] border border-red-500 bg-black"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="h-40 w-full object-cover"
                          />
                          <div className="flex items-center justify-between p-3">
                            <p className="truncate pr-2 text-xs text-white/60">{photo.name}</p>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="text-xs font-semibold text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Contact and visibility</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className={`${labelClass} md:col-span-2`}>
                    Contact number
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter your contact number"
                      className={inputClass}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        showContactNumber: !prev.showContactNumber,
                      }))
                    }
                    className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                      formData.showContactNumber
                        ? "border-red-500 bg-red-600/12 text-white"
                        : "border-red-500 bg-black text-white"
                    }`}
                  >
                    <span>
                      <p className="text-sm font-semibold">Show contact number</p>
                      <p className="mt-1 text-xs text-white/60">Let viewers call directly from the listing.</p>
                    </span>
                    <i className={`fas ${formData.showContactNumber ? "fa-eye" : "fa-eye-slash"}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        enableInAppChat: !prev.enableInAppChat,
                      }))
                    }
                    className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                      formData.enableInAppChat
                        ? "border-red-500 bg-red-600/12 text-white"
                        : "border-red-500 bg-black text-white"
                    }`}
                  >
                    <span>
                      <p className="text-sm font-semibold">Enable in-app messaging</p>
                      <p className="mt-1 text-xs text-white/60">Keep first conversations inside the platform.</p>
                    </span>
                    <i className={`fas ${formData.enableInAppChat ? "fa-comment-dots" : "fa-comment-slash"}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-red-500/70 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className={secondaryButtonClass}
                >
                  Clear form
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {editingId ? "Update vacancy" : "Post vacancy"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className={panelClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                    1. Core AI
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Smart Roommate Matching
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    Preview how a likely roommate profile fits your current listing.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Match Score: {liveRoommateMatch.matchScore}%
                </span>
              </div>

              <div className="mt-5 rounded-[26px] border border-red-500 bg-black p-4">
                <p className="text-sm font-semibold text-white">Compatibility: {liveRoommateMatch.matchScore}%</p>
                <p className="mt-2 text-sm text-white/70">
                  Reason: Both profiles align because {liveRoommateMatch.reason}.
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e_0%,#facc15_55%,#ef4444_100%)]"
                    style={{ width: `${liveRoommateMatch.matchScore}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {liveRoommateMatch.checks.map((check) => (
                    <div
                      key={check.key}
                      className={`rounded-2xl border px-4 py-3 ${
                        check.matched
                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                          : "border-red-500/70 bg-red-500/8 text-white"
                      }`}
                    >
                      <p className="font-semibold">
                        {check.matched ? "✔" : "✖"} {check.label}
                      </p>
                      <p className="mt-1 text-xs opacity-80">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-white">Prospective roommate profile</p>
                <div className="mt-4 grid gap-4">
                  <label className={labelClass}>
                    Candidate name
                    <input
                      type="text"
                      name="name"
                      value={seekerProfile.name}
                      onChange={handleSeekerProfileChange}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Monthly budget
                    <input
                      type="text"
                      name="budget"
                      value={seekerProfile.budget}
                      onChange={handleSeekerProfileChange}
                      placeholder="8000"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Sleep schedule
                    <input
                      type="text"
                      name="sleepSchedule"
                      value={seekerProfile.sleepSchedule}
                      onChange={handleSeekerProfileChange}
                      placeholder="Night owl"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Cleanliness
                    <input
                      type="text"
                      name="cleanliness"
                      value={seekerProfile.cleanliness}
                      onChange={handleSeekerProfileChange}
                      placeholder="Clean and hygienic habits"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Smoking
                    <input
                      type="text"
                      name="smoking"
                      value={seekerProfile.smoking}
                      onChange={handleSeekerProfileChange}
                      placeholder="Non-smoker preferred"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Interests
                    <input
                      type="text"
                      name="interests"
                      value={seekerProfile.interests}
                      onChange={handleSeekerProfileChange}
                      placeholder="Gaming, movies, music"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                6. Next Level
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Location Intelligence</h3>
              <p className="mt-2 text-sm text-white/65">
                Match locality preferences against the room location to help shortlist faster.
              </p>

              <div className="mt-5 rounded-[26px] border border-red-500 bg-black p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-white">Area fit</p>
                  <span className="rounded-full border border-sky-400/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                    {liveLocationMatch.score}%
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/70">{liveLocationMatch.reason}</p>
                <label className={`${labelClass} mt-4 block`}>
                  Preferred locations
                  <input
                    type="text"
                    name="preferredLocations"
                    value={seekerProfile.preferredLocations}
                    onChange={handleSeekerProfileChange}
                    placeholder="Tambaram, Velachery, flexible"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className={panelClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">Manage listings</h2>
                  <p className="mt-2 text-sm text-white/60">
                    Edit, mark full, or remove your current vacancy posts anytime.
                  </p>
                </div>
                <span className="rounded-full border border-red-500 bg-black px-3 py-1 text-xs font-semibold text-white">
                  {managedVacancies.length} saved
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {managedVacancies.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-red-500 bg-black px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-white">No vacancy listings yet</p>
                    <p className="mt-2 text-sm text-white/60">
                      Your first room-sharing post will appear here as soon as you publish it.
                    </p>
                  </div>
                ) : (
                  managedVacancies.map((listing) => (
                    <article
                      key={listing.id}
                      className="overflow-hidden rounded-[24px] border border-red-500 bg-black"
                    >
                      {(() => {
                        const listingMatch = buildRoommateMatch(listing, seekerProfile);

                        return (
                          <>
                            {listing.photos[0] && (
                              <img
                                src={listing.photos[0].url}
                                alt={listing.location}
                                className="h-44 w-full object-cover"
                              />
                            )}

                            <div className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-lg font-semibold text-white">
                                    {listing.propertyType} | {listing.roomType}
                                  </p>
                                  <p className="mt-1 text-sm text-white/60">{listing.location}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      listing.listingStatus === "Full"
                                        ? "border border-red-500 bg-black text-white"
                                        : "border border-red-500 bg-red-600/12 text-white"
                                    }`}
                                  >
                                    {listing.listingStatus}
                                  </span>
                                  <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                    Match {listingMatch.matchScore}%
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                                <div className="rounded-2xl border border-red-500 bg-black px-3 py-3">
                                  <p className="text-xs uppercase tracking-wide text-white/45">Rent</p>
                                  <p className="mt-1 font-semibold text-white">
                                    Rs. {listing.rentPerPerson}/person
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-red-500 bg-black px-3 py-3">
                                  <p className="text-xs uppercase tracking-wide text-white/45">Vacancies</p>
                                  <p className="mt-1 font-semibold text-white">
                                    {listing.availableSlots} open slots
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-red-500 bg-black px-3 py-3">
                                  <p className="text-xs uppercase tracking-wide text-white/45">Occupancy</p>
                                  <p className="mt-1 font-semibold text-white">
                                    {listing.currentOccupants}/{listing.totalCapacity}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-red-500 bg-black px-3 py-3">
                                  <p className="text-xs uppercase tracking-wide text-white/45">Occupations</p>
                                  <p className="mt-1 font-semibold text-white">
                                    {listing.preferences.occupation.length
                                      ? listing.preferences.occupation.join(", ")
                                      : "Any"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 rounded-[22px] border border-emerald-400/30 bg-emerald-500/5 p-4">
                                <p className="text-sm font-semibold text-white">
                                  Compatibility: {listingMatch.matchScore}%
                                </p>
                                <p className="mt-2 text-sm text-white/70">
                                  Reason: {listingMatch.reason}
                                </p>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                    listing.enableInAppChat
                                      ? "border-red-500 bg-red-600/12 text-white"
                                      : "border-red-500 bg-black text-white/60"
                                  }`}
                                >
                                  {listing.enableInAppChat ? "Chat enabled" : "Chat disabled"}
                                </span>
                                {amenityOptions
                                  .filter((amenity) => listing.amenities[amenity.key])
                                  .slice(0, 4)
                                  .map((amenity) => (
                                    <span
                                      key={amenity.key}
                                      className="rounded-full border border-red-500 bg-black px-3 py-1 text-xs font-medium text-white"
                                    >
                                      {amenity.label}
                                    </span>
                                  ))}
                              </div>

                              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleListingChat(listing)}
                                  disabled={!listing.enableInAppChat}
                                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                                    listing.enableInAppChat
                                      ? "border-red-500 text-white hover:bg-red-600/12"
                                      : "cursor-not-allowed border-red-500/40 text-white/40"
                                  }`}
                                >
                                  {String(listing.ownerId || "") === String(currentUser?._id || "")
                                    ? "Open inbox"
                                    : "Chat"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(listing)}
                                  className="rounded-2xl border border-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600/12"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusToggle(listing.id)}
                                  className="rounded-2xl border border-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600/12"
                                >
                                  {listing.listingStatus === "Full" ? "Reopen" : "Mark full"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(listing.id)}
                                  className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-red-500 bg-black p-6 text-white shadow-[0_24px_60px_-34px_rgba(239,68,68,0.45)]">
              <h3 className="text-lg font-semibold">What the Preferences menu shows</h3>
              <div className="mt-4 space-y-3 text-sm text-white/75">
                <p>Gender preference: {formData.preferences.gender}</p>
                <p>
                  Occupation:{" "}
                  {formData.preferences.occupation.length
                    ? formData.preferences.occupation.join(", ")
                    : "Any"}
                </p>
                <p>Smoking: {formData.preferences.smoking}</p>
                <p>Drinking: {formData.preferences.drinking}</p>
                <p>Cleanliness: {formData.preferences.cleanliness}</p>
                <p>Interests: {formData.preferences.interests || "Not specified"}</p>
                <p>
                  Sleep schedule: {formData.preferences.sleepSchedule || "Not specified"}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TenantRoomSharing;
