const STORAGE_KEY = "tenantRoomSharingListings";
export const PREFERENCE_STORAGE_KEY = "tenantRoomSharingPreferences";

const defaultAmenities = {
  wifi: false,
  attachedBathroom: false,
  ac: false,
  nonAc: true,
  food: false,
  housekeeping: false,
  parking: false,
};

const defaultPreferences = {
  gender: "Any",
  occupation: [],
  smoking: "Non-smoker preferred",
  drinking: "No preference",
  cleanliness: "Clean and hygienic habits",
  sleepSchedule: "",
  interests: "",
  other: "",
};

export const createEmptyVacancyForm = (currentUser) => ({
  id: null,
  ownerId: currentUser?._id || "",
  ownerName:
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim() ||
    currentUser?.username ||
    "",
  ownerRole: currentUser?.role || "user",
  propertyType: "PG",
  roomType: "Triple Sharing",
  location: "",
  rentPerPerson: "",
  currentOccupants: 1,
  totalCapacity: 3,
  availableSlots: 2,
  amenities: { ...defaultAmenities },
  preferences: { ...defaultPreferences },
  description:
    "I am currently staying in a PG accommodation and looking for additional roommates. Basic amenities are available, and we are looking for respectful people who are comfortable with shared living.",
  photos: [],
  showContactNumber: true,
  enableInAppChat: true,
  contactNumber: currentUser?.phone || "",
  listingStatus: "Open",
  createdAt: "",
  updatedAt: "",
});

const normalizePhoto = (photo, index) => {
  if (!photo) {
    return null;
  }

  if (typeof photo === "string") {
    return {
      id: `photo-${index}`,
      name: `Room photo ${index + 1}`,
      url: photo,
    };
  }

  return {
    id: photo.id || `photo-${index}`,
    name: photo.name || `Room photo ${index + 1}`,
    url: photo.url || "",
  };
};

export const normalizeVacancyListing = (listing = {}) => ({
  ...listing,
  id: String(listing.id || Date.now()),
  ownerId: listing.ownerId || "",
  ownerName: listing.ownerName || "",
  ownerRole: listing.ownerRole || "user",
  propertyType: listing.propertyType || "PG",
  roomType: listing.roomType || "Triple Sharing",
  location: listing.location || "",
  rentPerPerson: listing.rentPerPerson || "",
  currentOccupants: Number(listing.currentOccupants ?? 1),
  totalCapacity: Number(listing.totalCapacity ?? 3),
  availableSlots: Number(listing.availableSlots ?? 2),
  amenities: {
    ...defaultAmenities,
    ...(listing.amenities || {}),
  },
  preferences: {
    ...defaultPreferences,
    ...(listing.preferences || {}),
  },
  description: listing.description || "",
  photos: Array.isArray(listing.photos)
    ? listing.photos.map(normalizePhoto).filter(Boolean)
    : [],
  showContactNumber: listing.showContactNumber ?? true,
  enableInAppChat: listing.enableInAppChat ?? true,
  contactNumber: listing.contactNumber || "",
  listingStatus: listing.listingStatus || "Open",
  createdAt: listing.createdAt || new Date().toISOString(),
  updatedAt: listing.updatedAt || new Date().toISOString(),
});

export const getStoredTenantVacancies = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeVacancyListing) : [];
  } catch (error) {
    console.error("Unable to parse tenant room sharing listings", error);
    return [];
  }
};

export const saveStoredTenantVacancies = (listings) => {
  const normalized = Array.isArray(listings)
    ? listings.map(normalizeVacancyListing)
    : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const savePreferenceSnapshot = (preferences) => {
  localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event("tenantPreferencesUpdated"));
};

export const getPreferenceSnapshot = () => {
  try {
    const raw = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    return {
      ...defaultPreferences,
      ...JSON.parse(raw),
    };
  } catch (error) {
    console.error("Unable to parse tenant preference snapshot", error);
    return defaultPreferences;
  }
};
