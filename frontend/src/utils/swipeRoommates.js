import { buildLocationIntelligence, buildRoommateMatch } from "./roommateMatching";
import dummyProperties from "../data/dummyProperties";
import {
  getPreferenceSnapshot,
  getStoredTenantVacancies,
} from "./tenantVacancies";

const STORAGE_KEY = "smartSwipeRoommateState";

const candidateProfiles = [
  {
    id: "swipe-aanya",
    name: "Aanya",
    age: 24,
    occupation: "Product Designer",
    location: "Velachery, Chennai",
    budget: 8500,
    sleepSchedule: "Night owl",
    cleanliness: "Clean and hygienic habits",
    smoking: "Non-smoker preferred",
    interests: "gaming, movies, coffee walks",
    bio: "Remote designer who likes quiet weekdays, gaming marathons, and clean shared spaces.",
    likesYou: true,
    accent: "from-rose-500/30 via-orange-400/20 to-transparent",
  },
  {
    id: "swipe-vihaan",
    name: "Vihaan",
    age: 26,
    occupation: "Software Engineer",
    location: "Tambaram, Chennai",
    budget: 7800,
    sleepSchedule: "Night owl",
    cleanliness: "Very neat and organized",
    smoking: "No preference",
    interests: "gaming, coding, football",
    bio: "Late-night coder who wants affordable rent split, strong Wi-Fi, and a friendly roommate.",
    likesYou: true,
    accent: "from-sky-500/30 via-cyan-400/20 to-transparent",
  },
  {
    id: "swipe-meera",
    name: "Meera",
    age: 23,
    occupation: "MBA Student",
    location: "Guindy, Chennai",
    budget: 7000,
    sleepSchedule: "Early sleeper",
    cleanliness: "Moderately tidy",
    smoking: "Non-smoker preferred",
    interests: "reading, yoga, cooking",
    bio: "Prefers calm evenings and balanced routines, with shared respect around quiet hours.",
    likesYou: false,
    accent: "from-emerald-500/30 via-lime-400/20 to-transparent",
  },
  {
    id: "swipe-arnav",
    name: "Arnav",
    age: 27,
    occupation: "Marketing Lead",
    location: "Adyar, Chennai",
    budget: 9500,
    sleepSchedule: "Flexible",
    cleanliness: "Clean and hygienic habits",
    smoking: "Smoker okay",
    interests: "music, startups, badminton",
    bio: "Flexible schedule, social vibe, and happy to split errands if the room setup is right.",
    likesYou: false,
    accent: "from-violet-500/30 via-fuchsia-400/20 to-transparent",
  },
  {
    id: "swipe-sana",
    name: "Sana",
    age: 25,
    occupation: "Content Strategist",
    location: "Tambaram, Chennai",
    budget: 8200,
    sleepSchedule: "Night owl",
    cleanliness: "Clean and hygienic habits",
    smoking: "Non-smoker preferred",
    interests: "movies, music, gaming",
    bio: "Creative, sociable, and serious about keeping bills on time and common areas clean.",
    likesYou: true,
    accent: "from-amber-500/30 via-yellow-400/20 to-transparent",
  },
  {
    id: "swipe-kavin",
    name: "Kavin",
    age: 24,
    occupation: "Data Analyst",
    location: "OMR, Chennai",
    budget: 7600,
    sleepSchedule: "Flexible",
    cleanliness: "Clean and hygienic habits",
    smoking: "Non-smoker preferred",
    interests: "cricket, gaming, gym",
    bio: "Prefers organized shared spaces, budget-friendly rent splits, and active weekends.",
    likesYou: false,
    accent: "from-teal-500/30 via-cyan-400/20 to-transparent",
  },
  {
    id: "swipe-ishita",
    name: "Ishita",
    age: 22,
    occupation: "Architecture Student",
    location: "Vadapalani, Chennai",
    budget: 7200,
    sleepSchedule: "Night owl",
    cleanliness: "Moderately tidy",
    smoking: "Non-smoker preferred",
    interests: "movies, sketching, music",
    bio: "Creative roommate looking for a lively but respectful setup near college and metro routes.",
    likesYou: true,
    accent: "from-pink-500/30 via-rose-400/20 to-transparent",
  },
  {
    id: "swipe-rithik",
    name: "Rithik",
    age: 28,
    occupation: "Operations Manager",
    location: "Adyar, Chennai",
    budget: 9800,
    sleepSchedule: "Early sleeper",
    cleanliness: "Very neat and organized",
    smoking: "No preference",
    interests: "running, podcasts, cooking",
    bio: "Structured routine, quiet nights, and likes sharing a polished apartment with clear house rules.",
    likesYou: false,
    accent: "from-indigo-500/30 via-blue-400/20 to-transparent",
  },
];

const sanitizeBudget = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeLocality = (value = "") =>
  String(value).toLowerCase().trim();

const getMatchingProperties = (location) => {
  const locality = normalizeLocality(String(location).split(",")[0]);
  const matches = dummyProperties.filter(
    (property) => normalizeLocality(property.location?.locality) === locality
  );

  return matches.length ? matches : dummyProperties.slice(0, 3);
};

const getViewerListing = (currentUser) => {
  const vacancies = getStoredTenantVacancies();

  if (!currentUser?._id) {
    return vacancies[0] || null;
  }

  return (
    vacancies.find((listing) => String(listing.ownerId || "") === String(currentUser._id)) ||
    vacancies[0] ||
    null
  );
};

export const buildViewerRoommateProfile = (currentUser) => {
  const preferences = getPreferenceSnapshot();
  const listing = getViewerListing(currentUser);

  return {
    name:
      [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim() ||
      currentUser?.username ||
      "You",
    budget: sanitizeBudget(listing?.rentPerPerson) || 8000,
    sleepSchedule: preferences.sleepSchedule || "Night owl",
    cleanliness: preferences.cleanliness || "Clean and hygienic habits",
    smoking: preferences.smoking || "Non-smoker preferred",
    interests: preferences.interests || "gaming, movies, tea",
    preferredLocations: listing?.location || "Chennai, flexible",
  };
};

const buildCandidateListingShape = (profile) => ({
  rentPerPerson: profile.budget,
  location: profile.location,
  preferences: {
    sleepSchedule: profile.sleepSchedule,
    cleanliness: profile.cleanliness,
    smoking: profile.smoking,
    interests: profile.interests,
  },
});

export const buildSwipeDeck = (currentUser) => {
  const viewerProfile = buildViewerRoommateProfile(currentUser);

  return candidateProfiles.map((profile) => {
    const relatedProperties = getMatchingProperties(profile.location);
    const compatibility = buildRoommateMatch(
      buildCandidateListingShape(profile),
      viewerProfile
    );
    const locationFit = buildLocationIntelligence(
      profile.location,
      viewerProfile.preferredLocations
    );
    const greenFlags = compatibility.checks
      .filter((check) => check.matched)
      .slice(0, 3)
      .map((check) => check.label);
    const redFlags = compatibility.checks
      .filter((check) => !check.matched)
      .slice(0, 2)
      .map((check) => check.label);
    const propertyCards = relatedProperties.map((property, index) => ({
      id: `${profile.id}-property-${property._id}-${index}`,
      title: property.title,
      locality: property.location?.locality || profile.location,
      price: property.price,
      type: property.propertyType,
      rating: property.rating,
      description: property.description,
      image: property.images?.[0] || "",
    }));
    const primaryProperty = propertyCards[0];

    return {
      ...profile,
      compatibility,
      locationFit,
      greenFlags,
      redFlags,
      propertyCards,
      propertyTitle: primaryProperty?.title || `${profile.location} shared stay`,
      propertyType: primaryProperty?.type || "PG",
      propertyPrice: primaryProperty?.price || profile.budget,
      housePhotos: propertyCards.map((property) => property.image).filter(Boolean),
    };
  });
};

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Unable to parse smart swipe roommate state", error);
    return {};
  }
};

const writeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const defaultSessionState = {
  likedIds: [],
  skippedIds: [],
  matchIds: [],
  chats: {},
};

export const getSwipeSession = (currentUserId) => {
  const allState = readState();
  const key = currentUserId || "guest";

  return {
    ...defaultSessionState,
    ...(allState[key] || {}),
  };
};

export const saveSwipeSession = (currentUserId, session) => {
  const allState = readState();
  const key = currentUserId || "guest";
  allState[key] = {
    ...defaultSessionState,
    ...session,
  };
  writeState(allState);
};

export const buildInitialChatThread = (profile) => [
  {
    id: `${profile.id}-welcome`,
    sender: "them",
    text: `Hey! We matched because ${profile.compatibility.reason}. Want to compare room routines?`,
    createdAt: new Date().toISOString(),
  },
];
