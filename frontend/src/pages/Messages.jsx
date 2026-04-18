import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useAppSettings } from "../contexts/AppSettingsContext";

const formatParticipantName = (participant) => {
  if (!participant) return "Roommate";
  const fullName = [participant.firstName, participant.lastName].filter(Boolean).join(" ").trim();
  return fullName || participant.username || "Roommate";
};

const getConversationAudience = (participant) => {
  if (participant?.role === "host") {
    return "host";
  }

  return "tenant";
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatConversationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return formatTime(value);
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

const Messages = () => {
  const { currentUser } = useAuth();
  const { theme } = useAppSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [avatarErrors, setAvatarErrors] = useState({});

  const propertyIdFromQuery = searchParams.get("property");
  const receiverIdFromQuery = searchParams.get("receiver");
  const isHostAccount = currentUser?.role === "host";
  const conversationPollMs = isHostAccount ? 1800 : 3500;
  const detailPollMs = isHostAccount ? 1200 : 2200;

  useEffect(() => {
    setAvatarErrors({});
  }, [activeConversationId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const participant = conversation.participants?.find(
        (item) => String(item._id) !== String(currentUser?._id)
      );

      const participantName = formatParticipantName(participant).toLowerCase();
      const propertyTitle = conversation.property?.title?.toLowerCase() || "";
      const lastMessage = conversation.lastMessage?.content?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();

      return (
        participantName.includes(term) ||
        propertyTitle.includes(term) ||
        lastMessage.includes(term)
      );
    });
  }, [conversations, currentUser?._id, searchTerm]);

  const currentPartner = useMemo(() => {
    return activeConversation?.participants?.find(
      (item) => String(item._id) !== String(currentUser?._id)
    );
  }, [activeConversation, currentUser?._id]);

  const currentAudience = useMemo(
    () => getConversationAudience(currentPartner),
    [currentPartner]
  );

  const syncConversationList = (conversationData, latestMessage) => {
    setConversations((prev) => {
      const partner = conversationData.participants?.find(
        (item) => String(item._id) !== String(currentUser?._id)
      );
      const unreadCounts = conversationData.unreadCounts || {};
      const updatedConversation = {
        ...conversationData,
        participants: conversationData.participants || [],
        property: conversationData.property || null,
        lastMessage: latestMessage
          ? {
              content: latestMessage.content,
              sender: latestMessage.sender?._id || latestMessage.sender,
              createdAt: latestMessage.createdAt,
            }
          : conversationData.lastMessage,
        contactPhone: partner?.phone || conversationData.contactPhone,
        unreadBadge: unreadCounts[currentUser?._id] || 0,
      };

      const withoutCurrent = prev.filter((item) => String(item._id) !== String(updatedConversation._id));
      return [updatedConversation, ...withoutCurrent];
    });
  };

  const fetchConversations = async () => {
    const response = await api.get("/api/messages/conversations");
    const normalized = response.data.map((conversation) => ({
      ...conversation,
      unreadBadge: conversation.unreadCounts?.[currentUser?._id] || 0,
    }));

    setConversations(normalized);
    return normalized;
  };

  const fetchConversationDetail = async (conversationId, keepListVisible = false) => {
    if (!conversationId) return;

    setConversationLoading(true);
    setError("");

    try {
      const response = await api.get(`/api/messages/conversations/${conversationId}`);
      setActiveConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      setActiveConversationId(response.data.conversation._id);
      syncConversationList(response.data.conversation);

      if (!keepListVisible) {
        setMobileListOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load conversation");
    } finally {
      setConversationLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        let existingConversations = await fetchConversations();

        if (!isMounted) return;

        let targetConversation = null;

        if (propertyIdFromQuery && receiverIdFromQuery) {
          targetConversation = existingConversations.find((conversation) => {
            const hasProperty = String(conversation.property?._id) === String(propertyIdFromQuery);
            const hasReceiver = conversation.participants?.some(
              (participant) => String(participant._id) === String(receiverIdFromQuery)
            );
            return hasProperty && hasReceiver;
          });

          if (!targetConversation && !isHostAccount) {
            let createResponse;
            try {
              createResponse = await api.post("/api/messages/conversations", {
                receiverId: receiverIdFromQuery,
                propertyId: propertyIdFromQuery,
              });
            } catch (createError) {
              createResponse = await api.post("/api/messages/conversations", {
                receiverId: receiverIdFromQuery,
              });
            }

            targetConversation = createResponse.data;
            existingConversations = [targetConversation, ...existingConversations];
            setConversations((prev) => [targetConversation, ...prev]);
          }
        } else if (receiverIdFromQuery) {
          targetConversation = existingConversations.find((conversation) =>
            conversation.participants?.some(
              (participant) => String(participant._id) === String(receiverIdFromQuery)
            )
          );

          if (!targetConversation && !isHostAccount) {
            const createResponse = await api.post("/api/messages/conversations", {
              receiverId: receiverIdFromQuery,
            });

            targetConversation = createResponse.data;
            existingConversations = [targetConversation, ...existingConversations];
            setConversations((prev) => [targetConversation, ...prev]);
          }
        } else if (propertyIdFromQuery) {
          targetConversation = existingConversations.find(
            (conversation) => String(conversation.property?._id) === String(propertyIdFromQuery)
          );
        }

        const fallbackConversation = targetConversation || existingConversations[0];

        if (fallbackConversation?._id) {
          await fetchConversationDetail(fallbackConversation._id, true);
        } else {
          setMessages([]);
          setActiveConversation(null);
          setActiveConversationId(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load messages");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isHostAccount, propertyIdFromQuery, receiverIdFromQuery]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const conversationInterval = setInterval(() => {
      fetchConversations().catch(() => {});
    }, conversationPollMs);

    return () => clearInterval(conversationInterval);
  }, [conversationPollMs, currentUser]);

  useEffect(() => {
    if (!activeConversationId) return undefined;

    const detailInterval = setInterval(() => {
      fetchConversationDetail(activeConversationId, true).catch(() => {});
    }, detailPollMs);

    return () => clearInterval(detailInterval);
  }, [activeConversationId, detailPollMs]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const handleVisibilityRefresh = () => {
      if (document.visibilityState !== "visible") return;

      fetchConversations().catch(() => {});

      if (activeConversationId) {
        fetchConversationDetail(activeConversationId, true).catch(() => {});
      }
    };

    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [activeConversationId, currentUser]);

  useEffect(() => {
    if (!isHostAccount || activeConversationId || conversations.length === 0) {
      return;
    }

    const latestIncomingConversation =
      conversations.find((conversation) => conversation.unreadBadge > 0) ||
      conversations[0];

    if (latestIncomingConversation?._id) {
      fetchConversationDetail(latestIncomingConversation._id, true).catch(() => {});
    }
  }, [activeConversationId, conversations, isHostAccount]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    shouldAutoScrollRef.current = false;
  }, [messages]);

  const handleConversationClick = async (conversationId) => {
    shouldAutoScrollRef.current = false;
    await fetchConversationDetail(conversationId);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!newMessage.trim() || !activeConversation || !currentPartner?._id) {
      return;
    }

    if (isHostAccount) {
      setError("Host accounts cannot send new messages from this inbox.");
      return;
    }

    try {
      setSending(true);

      const response = await api.post("/api/messages/messages", {
        conversation: activeConversation._id,
        receiver: currentPartner._id,
        content: newMessage.trim(),
      });

      shouldAutoScrollRef.current = true;
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      syncConversationList(activeConversation, response.data);
      fetchConversationDetail(activeConversation._id, true).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the message");
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-neutral-50"}`}>
        <div className="text-center">
          <h1 className={`mb-4 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-neutral-800"}`}>You must be logged in to view messages</h1>
          <button
            onClick={() => navigate("/login")}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-neutral-50"}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
          <p className={theme === "dark" ? "text-white" : "text-neutral-600"}>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-6 md:py-8 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_transparent_28%),linear-gradient(180deg,_#fff8f1_0%,_#f8fafc_44%,_#ffffff_100%)] text-black"
      }`}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`mb-6 overflow-hidden rounded-[32px] border p-6 shadow-[0_28px_80px_-38px_rgba(15,23,42,0.4)] backdrop-blur md:p-8 ${
            theme === "dark"
              ? "border-red-400/50 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(8,8,8,0.96)_100%)]"
              : "border-orange-200/70 bg-white/85"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                theme === "dark"
                  ? "border-red-400/30 bg-red-500/10 text-white"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {isHostAccount ? "Host inbox" : currentAudience === "host" ? "Host chat" : "Roommate chat"}
              </span>
              <h1 className={`mt-3 text-3xl font-bold md:text-4xl ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
                {isHostAccount
                  ? "Receive tenant enquiries in one place"
                  : currentAudience === "host"
                    ? "Tenant and host can negotiate here"
                    : "Tenants can coordinate room sharing here"}
              </h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 md:text-base ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                {isHostAccount
                  ? "Hosts can review incoming tenant conversations here. Starting or sending new messages from the host side is disabled."
                  : currentAudience === "host"
                    ? "Use this conversation to discuss availability, advance payment, move-in date, amenities, and other room details."
                    : "Use this conversation to discuss available slots, roommate preferences, rent split, move-in timing, and shared room details."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className={`rounded-full border px-3 py-2 text-xs font-medium ${
                  theme === "dark"
                    ? "border-red-400/25 bg-white/[0.03] text-white/75"
                    : "border-neutral-200 bg-white text-neutral-600"
                }`}>
                  Live inbox
                </span>
                <span className={`rounded-full border px-3 py-2 text-xs font-medium ${
                  theme === "dark"
                    ? "border-red-400/25 bg-white/[0.03] text-white/75"
                    : "border-neutral-200 bg-white text-neutral-600"
                }`}>
                  {filteredConversations.length} conversations
                </span>
                <span className={`rounded-full border px-3 py-2 text-xs font-medium ${
                  theme === "dark"
                    ? "border-red-400/25 bg-white/[0.03] text-white/75"
                    : "border-neutral-200 bg-white text-neutral-600"
                }`}>
                  Negotiation ready
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMobileListOpen((prev) => !prev)}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition md:hidden ${
                  theme === "dark"
                    ? "border-red-400/50 bg-black text-white hover:border-red-300"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:text-primary-700"
                }`}
              >
                {mobileListOpen ? "Open Chat" : "Open Inbox"}
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${theme === "dark" ? "border-red-400/50 bg-black text-white" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
            {error}
          </div>
        )}

        <div className={`overflow-hidden rounded-[32px] border shadow-[0_28px_80px_-36px_rgba(15,23,42,0.42)] backdrop-blur ${
          theme === "dark"
            ? "border-red-400/50 bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(7,7,7,0.98)_100%)]"
            : "border-orange-200/70 bg-white/90"
        }`}>
          <div className="grid min-h-[72vh] grid-cols-1 md:grid-cols-[340px,minmax(0,1fr)]">
            <aside className={`${mobileListOpen ? "block" : "hidden"} border-r ${
              theme === "dark" ? "border-red-400/30 bg-white/[0.015]" : "border-neutral-100"
            } md:block`}>
              <div className={`border-b p-4 ${theme === "dark" ? "border-red-400/30" : "border-neutral-100"}`}>
                <div className={`flex items-center gap-3 rounded-[24px] border px-4 py-3 ${
                  theme === "dark"
                    ? "border-red-400/50 bg-black"
                    : "border-neutral-200 bg-neutral-50"
                }`}>
                  <i className={`fas fa-search text-xs ${theme === "dark" ? "text-white/45" : "text-neutral-400"}`} />
                  <input
                    type="text"
                    placeholder="Search conversations"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className={`w-full bg-transparent text-sm outline-none ${
                      theme === "dark"
                        ? "text-white placeholder:text-white/45"
                        : "text-neutral-800 placeholder:text-neutral-400"
                    }`}
                  />
                </div>
              </div>

              <div className="max-h-[72vh] space-y-3 overflow-y-auto p-3">
                {filteredConversations.length === 0 ? (
                  <div className={`rounded-[24px] border p-6 text-sm ${theme === "dark" ? "border-red-400/20 bg-black text-white/75" : "border-neutral-100 text-neutral-500"}`}>
                    No conversations yet. Start a chat from a property page or a roommate listing flow to begin.
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const partner = conversation.participants?.find(
                      (item) => String(item._id) !== String(currentUser?._id)
                    );

                    return (
                      <button
                        key={conversation._id}
                        onClick={() => handleConversationClick(conversation._id)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                          theme === "dark" ? "border-red-400/20 hover:bg-neutral-950/90" : "border-neutral-100 hover:bg-neutral-50"
                        } ${
                          String(activeConversationId) === String(conversation._id)
                            ? theme === "dark"
                              ? "bg-[linear-gradient(135deg,rgba(127,29,29,0.24),rgba(0,0,0,0.96))] shadow-[0_18px_40px_-26px_rgba(239,68,68,0.65)]"
                              : "bg-rose-50/70"
                            : theme === "dark"
                              ? "bg-black"
                              : "bg-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {partner?.profileImage ? (
                              <img
                                src={partner.profileImage}
                                alt={formatParticipantName(partner)}
                                className="h-12 w-12 rounded-2xl object-cover"
                                onError={() =>
                                  setAvatarErrors((prev) => ({
                                    ...prev,
                                    [conversation._id]: true,
                                  }))
                                }
                              />
                            ) : null}
                            {(!partner?.profileImage || avatarErrors[conversation._id]) && (
                              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme === "dark" ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}>
                                <span className="text-sm font-semibold">
                                  {formatParticipantName(partner).slice(0, 2)}
                                </span>
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className={`truncate text-sm font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
                                  {formatParticipantName(partner)}
                                </h3>
                                <p className={`truncate text-xs ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>
                                  {conversation.property?.title || "General chat"}
                                </p>
                              </div>
                              <span className={`shrink-0 text-xs ${theme === "dark" ? "text-white" : "text-neutral-400"}`}>
                                {formatConversationTime(
                                  conversation.lastMessage?.createdAt || conversation.updatedAt
                                )}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className={`truncate text-xs ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>
                                {conversation.lastMessage?.content || "Start the conversation"}
                              </p>
                              {conversation.unreadBadge > 0 && (
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white">
                                  {conversation.unreadBadge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className={`${mobileListOpen ? "hidden" : "flex"} min-h-[72vh] flex-col md:flex`}>
              {activeConversation ? (
                <>
                  <div className={`border-b p-4 md:p-5 ${
                    theme === "dark"
                      ? "border-red-400/30 bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(0,0,0,0.98))]"
                      : "border-neutral-100 bg-white/80"
                  }`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMobileListOpen(true)}
                          className={`rounded-xl border px-3 py-2 text-sm md:hidden ${theme === "dark" ? "border-red-400/50 bg-black text-white" : "border-neutral-200 bg-white text-neutral-600"}`}
                        >
                          Back
                        </button>

                        {currentPartner?.profileImage ? (
                          <img
                            src={currentPartner.profileImage}
                            alt={formatParticipantName(currentPartner)}
                            className="h-12 w-12 rounded-2xl object-cover"
                            onError={() =>
                              setAvatarErrors((prev) => ({
                                ...prev,
                                active: true,
                              }))
                            }
                          />
                        ) : null}
                        {(!currentPartner?.profileImage || avatarErrors.active) && (
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme === "dark" ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}>
                            <span className="text-sm font-semibold">
                              {formatParticipantName(currentPartner).slice(0, 2)}
                            </span>
                          </div>
                        )}

                        <div>
                          <h2 className={`text-base font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
                            {formatParticipantName(currentPartner)}
                          </h2>
                          <p className={`text-sm ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>
                            {activeConversation.property?.title ||
                              (currentAudience === "host" ? "Direct chat" : "Room-sharing chat")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                              theme === "dark"
                                ? "border-red-400/25 bg-white/[0.03] text-white/70"
                                : "border-neutral-200 bg-neutral-50 text-neutral-500"
                            }`}>
                              Active conversation
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                              theme === "dark"
                                ? "border-red-400/25 bg-white/[0.03] text-white/70"
                                : "border-neutral-200 bg-neutral-50 text-neutral-500"
                            }`}>
                              {messages.length} messages
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {currentPartner?.phone && (
                          <a
                            href={`tel:${currentPartner.phone}`}
                            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                              theme === "dark"
                                ? "border-red-400/50 bg-black text-white hover:border-red-300"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200 hover:text-primary-700"
                            }`}
                          >
                            <i className="fas fa-phone-alt mr-2" />
                            {currentPartner.phone}
                          </a>
                        )}
                        <button
                          onClick={() =>
                            navigate(
                              activeConversation.property?._id
                                ? `/properties/${activeConversation.property._id}`
                                : "/listings"
                            )
                          }
                          className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          {activeConversation.property?._id ? "View Room" : "Browse Listings"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`flex-1 overflow-y-auto px-4 py-5 md:px-6 ${
                    theme === "dark"
                      ? "bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.05),transparent_24%),linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(4,4,4,1)_100%)]"
                      : "bg-[linear-gradient(180deg,_rgba(255,247,248,0.85)_0%,_rgba(255,255,255,0.95)_30%,_#ffffff_100%)]"
                  }`}>
                    {conversationLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {messages.map((message) => {
                          const isMine = String(message.sender?._id || message.sender) === String(currentUser?._id);

                          return (
                            <motion.div
                              key={message._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[26px] px-4 py-3 shadow-sm md:max-w-[70%] ${
                                  isMine
                                    ? "rounded-br-md bg-red-600 text-white shadow-[0_18px_40px_-28px_rgba(239,68,68,0.9)]"
                                    : theme === "dark"
                                      ? "rounded-bl-md border border-red-400/30 bg-[linear-gradient(180deg,rgba(15,15,15,0.98),rgba(0,0,0,0.98))] text-white"
                                      : "rounded-bl-md bg-white text-neutral-800"
                                }`}
                              >
                                <p className="text-sm leading-6">{message.content}</p>
                                <div
                                  className={`mt-2 text-right text-[11px] ${
                                    isMine ? "text-red-100" : theme === "dark" ? "text-white" : "text-neutral-400"
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className={`border-t p-4 md:p-5 ${
                    theme === "dark"
                      ? "border-red-400/30 bg-[linear-gradient(180deg,rgba(0,0,0,0.98),rgba(10,10,10,0.98))]"
                      : "border-neutral-100 bg-white/90"
                  }`}>
                    <div className={`mb-3 rounded-[20px] border px-4 py-3 text-xs leading-5 ${
                      theme === "dark"
                        ? "border-red-400/20 bg-white/[0.03] text-white/80"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {isHostAccount
                        ? "This inbox is currently receive-only for host accounts. Tenants can initiate the conversation from listings and property pages."
                        : currentAudience === "host"
                          ? "Negotiate rent, ask about advance, food, curfew, amenities, and move-in timing directly with the host."
                          : "Discuss rent split, available slots, lifestyle preferences, amenities, and move-in timing directly with the other tenant."}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                      <textarea
                        placeholder={isHostAccount ? "Receive-only inbox for host accounts" : "Type your message..."}
                        className={`min-h-[56px] flex-1 resize-none rounded-[22px] border px-4 py-3 text-sm outline-none transition ${
                          theme === "dark"
                            ? "border-red-400/50 bg-black text-white focus:border-red-300 focus:ring-4 focus:ring-red-500/20"
                            : "border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                        }`}
                        rows={2}
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        disabled={isHostAccount}
                      />
                      <button
                        type="submit"
                        disabled={isHostAccount || sending || !newMessage.trim()}
                        className="rounded-[22px] bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isHostAccount ? "Receive Only" : sending ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-1 items-center justify-center p-8 text-center">
                  <div className={`max-w-md rounded-[28px] border p-8 ${
                    theme === "dark"
                      ? "border-red-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.98),rgba(10,10,10,0.95))]"
                      : "border-neutral-100 bg-white"
                  }`}>
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                      <i className="fas fa-comments text-2xl" />
                    </div>
                    <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>No conversation selected</h2>
                    <p className={`mt-2 text-sm ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>
                      Start a conversation from a listing, property details page, or roommate flow.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
