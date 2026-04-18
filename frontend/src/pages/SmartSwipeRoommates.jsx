import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  buildInitialChatThread,
  buildSwipeDeck,
  buildViewerRoommateProfile,
  getSwipeSession,
  saveSwipeSession,
} from "../utils/swipeRoommates";

const swipeThreshold = 120;
const reelThreshold = 110;

const SmartSwipeRoommates = () => {
  const { currentUser } = useAuth();
  const viewerProfile = useMemo(
    () => buildViewerRoommateProfile(currentUser),
    [currentUser]
  );
  const deck = useMemo(() => buildSwipeDeck(currentUser), [currentUser]);
  const [likedIds, setLikedIds] = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);
  const [matchIds, setMatchIds] = useState([]);
  const [chats, setChats] = useState({});
  const [activeMatchId, setActiveMatchId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [toast, setToast] = useState("");
  const [selectedPhotoIndexByProfile, setSelectedPhotoIndexByProfile] = useState({});
  const [activeProfileId, setActiveProfileId] = useState("");

  useEffect(() => {
    const session = getSwipeSession(currentUser?._id);
    setLikedIds(session.likedIds || []);
    setSkippedIds(session.skippedIds || []);
    setMatchIds(session.matchIds || []);
    setChats(session.chats || {});
    setActiveMatchId(session.matchIds?.[0] || "");
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) {
      return;
    }

    saveSwipeSession(currentUser._id, {
      likedIds,
      skippedIds,
      matchIds,
      chats,
    });
  }, [chats, currentUser?._id, likedIds, matchIds, skippedIds]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const remainingProfiles = useMemo(
    () =>
      deck.filter(
        (profile) =>
          !likedIds.includes(profile.id) && !skippedIds.includes(profile.id)
      ),
    [deck, likedIds, skippedIds]
  );

  useEffect(() => {
    if (!remainingProfiles.length) {
      setActiveProfileId("");
      return;
    }

    const exists = remainingProfiles.some((profile) => profile.id === activeProfileId);
    if (!exists) {
      setActiveProfileId(remainingProfiles[0].id);
    }
  }, [activeProfileId, remainingProfiles]);

  const activeProfileIndex = Math.max(
    0,
    remainingProfiles.findIndex((profile) => profile.id === activeProfileId)
  );
  const currentCard = remainingProfiles[activeProfileIndex] || remainingProfiles[0] || null;
  const nextCard = remainingProfiles[activeProfileIndex + 1] || null;
  const previousCard = activeProfileIndex > 0 ? remainingProfiles[activeProfileIndex - 1] : null;
  const reelPreviewProfiles = remainingProfiles.slice(activeProfileIndex, activeProfileIndex + 4);
  const matchedProfiles = deck.filter((profile) => matchIds.includes(profile.id));
  const activeMatch =
    matchedProfiles.find((profile) => profile.id === activeMatchId) ||
    matchedProfiles[0] ||
    null;
  const activeChat = activeMatch ? chats[activeMatch.id] || [] : [];

  const selectedPhotoIndex = currentCard
    ? selectedPhotoIndexByProfile[currentCard.id] || 0
    : 0;
  const selectedPhoto =
    currentCard?.housePhotos?.[selectedPhotoIndex] || currentCard?.housePhotos?.[0] || "";

  const handleSwipe = (direction, profile = currentCard) => {
    if (!profile) {
      return;
    }

    if (direction === "right") {
      if (!likedIds.includes(profile.id)) {
        setLikedIds((prev) => [...prev, profile.id]);
      }

      if (profile.likesYou && !matchIds.includes(profile.id)) {
        setMatchIds((prev) => [...prev, profile.id]);
        setChats((prev) => ({
          ...prev,
          [profile.id]: prev[profile.id] || buildInitialChatThread(profile),
        }));
        setActiveMatchId(profile.id);
        setToast(`It's a match with ${profile.name}. Chat unlocked.`);
      } else {
        setToast(`Liked ${profile.name}. Waiting to see if they like you back.`);
      }

      return;
    }

    if (!skippedIds.includes(profile.id)) {
      setSkippedIds((prev) => [...prev, profile.id]);
    }
    setToast(`Skipped ${profile.name}.`);
  };

  const handleSendMessage = () => {
    if (!activeMatch || !newMessage.trim()) {
      return;
    }

    setChats((prev) => ({
      ...prev,
      [activeMatch.id]: [
        ...(prev[activeMatch.id] || []),
        {
          id: `${activeMatch.id}-${Date.now()}`,
          sender: "me",
          text: newMessage.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNewMessage("");
  };

  const handlePhotoSelect = (profileId, photoIndex) => {
    setSelectedPhotoIndexByProfile((prev) => ({
      ...prev,
      [profileId]: photoIndex,
    }));
  };

  const moveReel = (direction) => {
    if (!remainingProfiles.length) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? Math.min(activeProfileIndex + 1, remainingProfiles.length - 1)
        : Math.max(activeProfileIndex - 1, 0);

    setActiveProfileId(remainingProfiles[nextIndex].id);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(190,24,93,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_22%),linear-gradient(180deg,#09090b_0%,#111827_48%,#020617_100%)] py-8 text-white">
      <div className="container mx-auto px-4">
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-black/40 shadow-[0_30px_90px_-40px_rgba(244,63,94,0.55)] backdrop-blur-md">
          <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div>
              <span className="inline-flex rounded-full border border-rose-300/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">
                Smart Swipe Roommate Matching
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold md:text-5xl">
                Swipe fast, but let AI explain why a roommate is actually a fit.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                Browse roommate profiles like cards, swipe right to like or left to skip,
                and let the app score compatibility before you decide. When the interest is
                mutual, chat unlocks instantly inside this flow.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/tenant/room-sharing"
                  className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Back to Room Sharing
                </Link>
                <Link
                  to="/messages"
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Inbox
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Your AI Profile
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/45">Budget</p>
                  <p className="mt-2 text-xl font-semibold">Rs. {viewerProfile.budget}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/45">Sleep style</p>
                  <p className="mt-2 text-xl font-semibold">{viewerProfile.sleepSchedule}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/45">Cleanliness</p>
                  <p className="mt-2 text-sm font-semibold">{viewerProfile.cleanliness}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-white/45">Interests</p>
                  <p className="mt-2 text-sm font-semibold capitalize">{viewerProfile.interests}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[34px] border border-white/10 bg-black/35 p-6 shadow-[0_30px_90px_-44px_rgba(56,189,248,0.45)] backdrop-blur-md md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Swipe Deck
                </p>
                <h2 className="mt-2 text-2xl font-bold">AI-ranked roommate cards</h2>
                <p className="mt-2 text-sm text-white/60">
                  Swipe up and down like reels to browse profiles, then like or skip.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                {remainingProfiles.length} profiles left
              </div>
            </div>

            <div className="relative mt-8 flex min-h-[640px] items-center justify-center">
              {previousCard && (
                <button
                  type="button"
                  onClick={() => moveReel("prev")}
                  className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white/75 backdrop-blur-sm transition hover:bg-white/10"
                >
                  Swipe Up for {previousCard.name}
                </button>
              )}
              {nextCard && (
                <div className={`absolute inset-x-8 top-8 h-[560px] rounded-[32px] border border-white/10 bg-gradient-to-br ${nextCard.accent} bg-black/70 opacity-55 blur-[1px]`} />
              )}

              <AnimatePresence mode="wait">
                {currentCard ? (
                  <motion.article
                    key={currentCard.id}
                    drag
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      const horizontalSwipe = Math.abs(info.offset.x) >= Math.abs(info.offset.y);

                      if (horizontalSwipe && info.offset.x > swipeThreshold) {
                        handleSwipe("right", currentCard);
                      } else if (horizontalSwipe && info.offset.x < -swipeThreshold) {
                        handleSwipe("left", currentCard);
                      } else if (!horizontalSwipe && info.offset.y < -reelThreshold) {
                        moveReel("next");
                      } else if (!horizontalSwipe && info.offset.y > reelThreshold) {
                        moveReel("prev");
                      }
                    }}
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, x: -140, rotate: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={`relative h-[680px] w-full max-w-[430px] overflow-hidden rounded-[34px] border border-white/15 bg-gradient-to-br ${currentCard.accent} shadow-[0_32px_90px_-40px_rgba(15,23,42,0.92)]`}
                  >
                    {selectedPhoto ? (
                      <img
                        src={selectedPhoto}
                        alt={currentCard.propertyTitle}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.26)_28%,rgba(2,6,23,0.72)_62%,rgba(2,6,23,0.96)_100%)]" />
                    <div className="relative flex h-full flex-col justify-between p-6">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="max-w-[75%] rounded-[28px] border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                              Swipe Stay
                            </p>
                            <h3 className="mt-2 text-2xl font-bold">
                              {currentCard.propertyTitle}
                            </h3>
                            <p className="mt-1 text-sm text-white/72">
                              {currentCard.propertyType} | Rs. {currentCard.propertyPrice}/month
                            </p>
                          </div>
                          <div className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                            Match Score: {currentCard.compatibility.matchScore}%
                          </div>
                        </div>

                        {currentCard.housePhotos?.length ? (
                          <div className="mt-4 flex gap-2">
                            {currentCard.housePhotos.slice(0, 4).map((photo, index) => (
                              <button
                                key={`${currentCard.id}-photo-${index}`}
                                type="button"
                                onClick={() => handlePhotoSelect(currentCard.id, index)}
                                className={`h-14 w-14 overflow-hidden rounded-2xl border transition ${
                                  selectedPhotoIndex === index
                                    ? "border-white"
                                    : "border-white/20 opacity-80 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`${currentCard.propertyTitle} view ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-6">
                          <h3 className="text-3xl font-bold">
                            {currentCard.name}, {currentCard.age}
                          </h3>
                          <p className="mt-2 text-sm text-white/70">
                            {currentCard.occupation} | {currentCard.location}
                          </p>
                          <p className="mt-5 text-sm leading-7 text-white/78">
                            {currentCard.bio}
                          </p>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-white/10 bg-black/30 p-4">
                          <p className="text-sm font-semibold text-white">
                            Why AI likes this match
                          </p>
                          <p className="mt-2 text-sm text-white/70">
                            {currentCard.compatibility.reason}
                          </p>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#34d399_0%,#22c55e_38%,#f59e0b_72%,#fb7185_100%)]"
                              style={{ width: `${currentCard.compatibility.matchScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                            <p className="text-xs uppercase tracking-wide text-white/45">Budget</p>
                            <p className="mt-1 font-semibold">Rs. {currentCard.budget}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                            <p className="text-xs uppercase tracking-wide text-white/45">Location fit</p>
                            <p className="mt-1 font-semibold">{currentCard.locationFit.score}%</p>
                          </div>
                        </div>

                        {currentCard.propertyCards?.length ? (
                          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/25 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                              Similar house options
                            </p>
                            <div className="mt-3 grid gap-2">
                              {currentCard.propertyCards.slice(0, 3).map((property, index) => (
                                <button
                                  key={property.id}
                                  type="button"
                                  onClick={() => handlePhotoSelect(currentCard.id, index)}
                                  className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                    selectedPhotoIndex === index
                                      ? "border-emerald-300/40 bg-emerald-500/10 text-white"
                                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                  }`}
                                >
                                  <span className="pr-3">
                                    <span className="block font-semibold">{property.title}</span>
                                    <span className="mt-1 block text-xs opacity-75">
                                      {property.locality} | {property.type}
                                    </span>
                                  </span>
                                  <span className="text-xs font-semibold">Select</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {currentCard.greenFlags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
                            >
                              Yes: {flag}
                            </span>
                          ))}
                          {currentCard.redFlags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full border border-rose-300/25 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-100"
                            >
                              Watch: {flag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleSwipe("left", currentCard)}
                            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                          >
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwipe("right", currentCard)}
                            className="rounded-2xl bg-primary-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                          >
                            Like This Home
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-white/55">
                          <button
                            type="button"
                            onClick={() => moveReel("prev")}
                            disabled={activeProfileIndex === 0}
                            className="rounded-full border border-white/10 px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-35 hover:bg-white/10"
                          >
                            Up
                          </button>
                          <span>
                            Reel {activeProfileIndex + 1} of {remainingProfiles.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveReel("next")}
                            disabled={activeProfileIndex === remainingProfiles.length - 1}
                            className="rounded-full border border-white/10 px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-35 hover:bg-white/10"
                          >
                            Down
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[430px] rounded-[34px] border border-dashed border-white/15 bg-white/5 p-10 text-center"
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl">
                      <i className="fas fa-check" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold">Deck complete</h3>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      You've reviewed every roommate card in this batch. Your matches stay
                      unlocked below, and you can come back after updating preferences for a
                      fresh AI-ranked deck.
                    </p>
                    <Link
                      to="/tenant/room-sharing"
                      className="mt-6 inline-flex rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      Update Preferences
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[34px] border border-white/10 bg-black/35 p-6 backdrop-blur-md md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Profile Reels
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">Different profile cards</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  Swipe up/down
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {reelPreviewProfiles.map((profile, index) => {
                  const absoluteIndex = activeProfileIndex + index;
                  const isActive = profile.id === currentCard?.id;

                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setActiveProfileId(profile.id)}
                      className={`flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                        {profile.housePhotos?.[0] ? (
                          <img
                            src={profile.housePhotos[0]}
                            alt={profile.propertyTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold">{profile.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                          Profile {absoluteIndex + 1}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold">{profile.name}</p>
                        <p className="mt-1 truncate text-xs text-white/55">
                          {profile.occupation} | {profile.location}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold">
                        {profile.compatibility.matchScore}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/35 p-6 backdrop-blur-md md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Compatibility Breakdown
              </p>
              {currentCard ? (
                <div className="mt-5 space-y-3">
                  {currentCard.compatibility.checks.map((check) => (
                    <div
                      key={check.key}
                      className={`rounded-[24px] border px-4 py-4 ${
                        check.matched
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                          : "border-rose-400/25 bg-rose-500/10 text-rose-100"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {check.matched ? "Yes" : "Watch"}: {check.label}
                      </p>
                      <p className="mt-2 text-xs opacity-85">{check.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-white/70">
                  Swipe through the deck to see the AI breakdown for each candidate.
                </p>
              )}
            </section>

            <section className="rounded-[34px] border border-white/10 bg-black/35 p-6 backdrop-blur-md md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Mutual Matches
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">Chat unlocked</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  {matchedProfiles.length} matches
                </span>
              </div>

              {matchedProfiles.length ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {matchedProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => setActiveMatchId(profile.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          activeMatch?.id === profile.id
                            ? "border-emerald-400/50 bg-emerald-500/10 text-white"
                            : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-sm font-semibold">{profile.name}</p>
                        <p className="mt-1 text-xs">
                          {profile.compatibility.matchScore}% match
                        </p>
                      </button>
                    ))}
                  </div>

                  {activeMatch && (
                    <div className="mt-6 rounded-[28px] border border-white/10 bg-black/30 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{activeMatch.name}</p>
                          <p className="mt-1 text-sm text-white/60">
                            {activeMatch.compatibility.reason}
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                          Match
                        </span>
                      </div>

                      <div className="mt-5 max-h-[240px] space-y-3 overflow-y-auto pr-1">
                        {activeChat.map((message) => (
                          <div
                            key={message.id}
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                              message.sender === "me"
                                ? "ml-auto bg-primary-600 text-white"
                                : "bg-white/8 text-white/80"
                            }`}
                          >
                            {message.text}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(event) => setNewMessage(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                          placeholder={`Message ${activeMatch.name}`}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-emerald-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-white">No mutual matches yet</p>
                  <p className="mt-2 text-sm text-white/65">
                    Swipe right on high-compatibility profiles to unlock chat instantly when
                    they already like you back.
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 left-1/2 z-[1500] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-emerald-300/30 bg-black/85 px-5 py-4 text-sm text-white shadow-[0_24px_60px_-24px_rgba(16,185,129,0.45)] backdrop-blur-md"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSwipeRoommates;
