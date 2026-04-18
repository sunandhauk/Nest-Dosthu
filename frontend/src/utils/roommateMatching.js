const SCORE_WEIGHTS = {
  budget: 28,
  sleep: 20,
  cleanliness: 18,
  smoking: 14,
  interests: 20,
};

const LOCATION_WEIGHT = 100;

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitList = (value = "") =>
  normalizeText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const unique = (items) => [...new Set(items)];

const hasNoPreference = (value = "") =>
  normalizeText(value).includes("no preference");

const tokenize = (value = "") =>
  unique(
    normalizeText(value)
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length > 2)
  );

const sharedTokens = (left = "", right = "") => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  return leftTokens.filter((token) => rightTokens.includes(token));
};

const buildBudgetCheck = (listing, seeker) => {
  const rent = Number(listing.rentPerPerson || 0);
  const budget = Number(seeker.budget || 0);

  if (!rent || !budget) {
    return {
      key: "budget",
      label: "Budget match",
      matched: false,
      score: 10,
      detail: "Add rent and budget to unlock a stronger match signal.",
      reasonFragment: "",
    };
  }

  const difference = Math.abs(budget - rent);
  const ratio = difference / Math.max(budget, rent, 1);

  if (rent <= budget) {
    return {
      key: "budget",
      label: "Budget match",
      matched: true,
      score: SCORE_WEIGHTS.budget,
      detail: `Seeker budget Rs. ${budget} covers the Rs. ${rent}/person rent.`,
      reasonFragment: "same budget",
    };
  }

  if (ratio <= 0.15) {
    return {
      key: "budget",
      label: "Budget nearly aligned",
      matched: true,
      score: 20,
      detail: `Rent is slightly above budget by Rs. ${difference}.`,
      reasonFragment: "budget is close",
    };
  }

  return {
    key: "budget",
    label: "Budget mismatch",
    matched: false,
    score: 6,
    detail: `Rent exceeds budget by Rs. ${difference}.`,
    reasonFragment: "",
  };
};

const buildSleepCheck = (preferences, seeker) => {
  const hostValue = normalizeText(preferences.sleepSchedule);
  const seekerValue = normalizeText(seeker.sleepSchedule);

  if (!hostValue || !seekerValue) {
    return {
      key: "sleep",
      label: "Sleep schedule",
      matched: false,
      score: 8,
      detail: "Add both sleep styles for a stronger recommendation.",
      reasonFragment: "",
    };
  }

  const exact = hostValue === seekerValue;
  const partial =
    hostValue.includes(seekerValue) ||
    seekerValue.includes(hostValue) ||
    sharedTokens(hostValue, seekerValue).length > 0;

  if (exact || partial) {
    return {
      key: "sleep",
      label: "Same sleep time",
      matched: true,
      score: SCORE_WEIGHTS.sleep,
      detail: `${preferences.sleepSchedule} aligns with ${seeker.sleepSchedule}.`,
      reasonFragment: `both prefer ${normalizeText(seeker.sleepSchedule) || "similar sleep routines"}`,
    };
  }

  return {
    key: "sleep",
    label: "Different sleep time",
    matched: false,
    score: 4,
    detail: `${preferences.sleepSchedule} may clash with ${seeker.sleepSchedule}.`,
    reasonFragment: "",
  };
};

const buildCleanlinessCheck = (preferences, seeker) => {
  const hostValue = normalizeText(preferences.cleanliness);
  const seekerValue = normalizeText(seeker.cleanliness);

  if (!hostValue || !seekerValue) {
    return {
      key: "cleanliness",
      label: "Cleanliness",
      matched: false,
      score: 8,
      detail: "Add cleanliness expectations to improve the score.",
      reasonFragment: "",
    };
  }

  const overlap = sharedTokens(hostValue, seekerValue);
  const matched =
    overlap.length > 0 ||
    hostValue.includes(seekerValue) ||
    seekerValue.includes(hostValue);

  return matched
    ? {
        key: "cleanliness",
        label: "Same cleanliness level",
        matched: true,
        score: SCORE_WEIGHTS.cleanliness,
        detail: `${preferences.cleanliness} feels compatible with ${seeker.cleanliness}.`,
        reasonFragment: "cleanliness expectations line up",
      }
    : {
        key: "cleanliness",
        label: "Different cleanliness level",
        matched: false,
        score: 4,
        detail: `${preferences.cleanliness} may not align with ${seeker.cleanliness}.`,
        reasonFragment: "",
      };
};

const buildSmokingCheck = (preferences, seeker) => {
  const hostValue = normalizeText(preferences.smoking);
  const seekerValue = normalizeText(seeker.smoking);

  if (!hostValue || !seekerValue) {
    return {
      key: "smoking",
      label: "Smoking habits",
      matched: false,
      score: 6,
      detail: "Smoking preference is missing.",
      reasonFragment: "",
    };
  }

  if (hasNoPreference(preferences.smoking) || hasNoPreference(seeker.smoking)) {
    return {
      key: "smoking",
      label: "Smoking preference flexible",
      matched: true,
      score: SCORE_WEIGHTS.smoking - 2,
      detail: "At least one side is flexible about smoking habits.",
      reasonFragment: "smoking preference is flexible",
    };
  }

  const matched = hostValue === seekerValue || sharedTokens(hostValue, seekerValue).length > 0;

  return matched
    ? {
        key: "smoking",
        label: "Smoking habits aligned",
        matched: true,
        score: SCORE_WEIGHTS.smoking,
        detail: `${preferences.smoking} matches ${seeker.smoking}.`,
        reasonFragment: "same smoking preference",
      }
    : {
        key: "smoking",
        label: "Smoking habits differ",
        matched: false,
        score: 3,
        detail: `${preferences.smoking} may conflict with ${seeker.smoking}.`,
        reasonFragment: "",
      };
};

const buildInterestsCheck = (preferences, seeker) => {
  const hostInterests = splitList(preferences.interests);
  const seekerInterests = splitList(seeker.interests);
  const overlap = hostInterests.filter((interest) => seekerInterests.includes(interest));

  if (!hostInterests.length || !seekerInterests.length) {
    return {
      key: "interests",
      label: "Shared interests",
      matched: false,
      score: 8,
      detail: "Add interests to personalize the roommate match.",
      reasonFragment: "",
    };
  }

  if (overlap.length) {
    return {
      key: "interests",
      label: "Shared interests",
      matched: true,
      score: SCORE_WEIGHTS.interests,
      detail: `Common interests: ${overlap.join(", ")}.`,
      reasonFragment: `love ${overlap[0]}`,
    };
  }

  return {
    key: "interests",
    label: "Different interests",
    matched: false,
    score: 4,
    detail: "No strong overlap in listed interests yet.",
    reasonFragment: "",
  };
};

export const buildRoommateMatch = (listing, seeker) => {
  const preferences = listing?.preferences || {};
  const checks = [
    buildBudgetCheck(listing, seeker),
    buildSleepCheck(preferences, seeker),
    buildCleanlinessCheck(preferences, seeker),
    buildSmokingCheck(preferences, seeker),
    buildInterestsCheck(preferences, seeker),
  ];

  const totalWeight = Object.values(SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0);
  const earnedScore = checks.reduce((sum, item) => sum + item.score, 0);
  const matchScore = Math.max(0, Math.min(99, Math.round((earnedScore / totalWeight) * 100)));
  const highlights = checks
    .filter((item) => item.matched && item.reasonFragment)
    .slice(0, 3)
    .map((item) => item.reasonFragment);

  const reason = highlights.length
    ? `${highlights.join(" + ")}`
    : "Lifestyle preferences are partially aligned.";

  return {
    matchScore,
    checks,
    reason,
    summary: matchScore >= 85 ? "Strong roommate match" : matchScore >= 65 ? "Promising match" : "Needs review",
  };
};

export const buildLocationIntelligence = (listingLocation = "", seekerLocations = "") => {
  const matches = sharedTokens(listingLocation, seekerLocations);
  const score = matches.length
    ? 90
    : normalizeText(seekerLocations).includes("flexible")
      ? 74
      : 46;

  const reason = matches.length
    ? `Matching area signal: ${matches.join(", ")}`
    : normalizeText(seekerLocations).includes("flexible")
      ? "Seeker is flexible on locality, so this area still looks viable."
      : "No direct area overlap yet. Consider refining locality preferences.";

  return {
    score: Math.max(0, Math.min(LOCATION_WEIGHT, score)),
    reason,
  };
};
