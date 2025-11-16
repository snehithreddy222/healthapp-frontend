// src/pages/doctor/DoctorMessages.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiAlertCircle,
  FiSend,
  FiMail,
  FiUser,
} from "react-icons/fi";
import { format } from "date-fns";
import { messageService } from "../../services/messageService";

const POLL_MS = 4000; // 4 seconds for softer real-time

export default function DoctorMessages() {
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedThreadId, setSelectedThreadId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  async function loadThreads() {
    setThreadsLoading(true);
    setThreadsError("");
    try {
      const list = await messageService.listThreads();
      const items = Array.isArray(list) ? list : list?.items || [];
      setThreads(items);

      // If nothing selected yet, or selected id no longer exists, pick the newest
      if (items.length > 0) {
        if (!selectedThreadId || !items.some((t) => t.id === selectedThreadId)) {
          setSelectedThreadId(items[0].id);
        }
      } else {
        setSelectedThreadId(null);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load message threads";
      setThreadsError(msg);
    } finally {
      setThreadsLoading(false);
    }
  }

  async function loadMessages(threadId) {
    if (!threadId) {
      setMessages([]);
      setMessagesError("");
      return;
    }

    setMessagesLoading(true);
    setMessagesError("");

    try {
      const list = await messageService.listMessages(threadId);
      const items = Array.isArray(list) ? list : list?.items || [];
      setMessages(items);

      // Mark thread as read for this doctor (non-blocking)
      messageService.markThreadRead(threadId).catch(() => {});

      // Optimistically clear unread count in local state
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, unreadCount: 0 } : t
        )
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load conversation";
      setMessagesError(msg);
    } finally {
      setMessagesLoading(false);
    }
  }

  function handleSelectThread(threadId) {
    // Always load, even if it is already selected
    setSelectedThreadId(threadId);
    setMessagesError("");
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!selectedThread || !composer.trim() || sending) return;

    const text = composer.trim();
    setSending(true);

    try {
      const newMsg = await messageService.sendMessage(
        selectedThread.id,
        text
      );

      setMessages((prev) => [...prev, newMsg]);
      setComposer("");

      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThread.id
            ? {
                ...t,
                lastMessageSnippet: text,
                lastMessageAt: newMsg.sentAt || newMsg.createdAt,
              }
            : t
        )
      );

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop =
            scrollRef.current.scrollHeight;
        }
      }, 50);
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "Unable to send message";
      setMessagesError(msg);
    } finally {
      setSending(false);
    }
  }

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      const counterpart =
        t.counterpartName ||
        t.otherPartyName ||
        t.title ||
        "";
      const lastSnippet = t.lastMessageSnippet || "";
      return (
        counterpart.toLowerCase().includes(q) ||
        lastSnippet.toLowerCase().includes(q)
      );
    });
  }, [threads, search]);

  // Initial load
  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selectedThreadId changes, load its messages
  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  // Poll for updates to threads and active conversation
  useEffect(() => {
    if (!selectedThreadId) return;
    let cancelled = false;

    async function tick() {
      try {
        const [threadsResult, messagesResult] = await Promise.all([
          messageService.listThreads().catch(() => []),
          messageService.listMessages(selectedThreadId).catch(() => []),
        ]);

        if (cancelled) return;

        const items = Array.isArray(threadsResult)
          ? threadsResult
          : threadsResult?.items || [];
        setThreads(items);

        const msgs = Array.isArray(messagesResult)
          ? messagesResult
          : messagesResult?.items || [];
        setMessages(msgs);
      } catch {
        // ignore in poll
      }
    }

    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        tick();
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedThreadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function formatTimeOrDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    return sameDay
      ? format(d, "HH:mm")
      : format(d, "dd MMM");
  }

  function renderThreadSubtitle(thread) {
    const counterpart =
      thread.counterpartRole === "PATIENT" ||
      thread.otherPartyRole === "PATIENT"
        ? "Patient"
        : thread.counterpartRole || thread.otherPartyRole || "";

    const pieces = [];
    if (counterpart) pieces.push(counterpart);
    if (thread.lastMessageAt) {
      pieces.push(formatTimeOrDate(thread.lastMessageAt));
    }
    return pieces.join(" · ");
  }

  function renderMessageBubble(msg) {
    const mine = msg.isMine;
    const align = mine ? "items-end" : "items-start";
    const bubbleBase = mine
      ? "bg-sky-600 text-white"
      : "bg-slate-100 text-slate-900";

    return (
      <div
        key={msg.id}
        className={`flex flex-col ${align} gap-1 text-sm`}
      >
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {!mine && (
            <span className="font-medium">
              {msg.senderName || "Patient"}
            </span>
          )}
          <span>{formatTimeOrDate(msg.sentAt || msg.createdAt)}</span>
        </div>
        <div
          className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${bubbleBase}`}
        >
          <p className="whitespace-pre-wrap break-words">
            {msg.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-xl">
            View secure messages with your patients and care team.
            Replies are visible to the patient in their portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <FiSearch className="text-slate-500" />
            <input
              type="text"
              placeholder="Search patients or messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={loadThreads}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 transition"
          >
            <FiMail className="text-xs" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main content: thread list + conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] gap-6 min-h-[540px]">
        {/* Threads list */}
        <section className="card-soft flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Conversations
              </h2>
              <p className="text-xs text-slate-500">
                Threads that include you as a participant.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {threads.length} thread
              {threads.length === 1 ? "" : "s"}
            </p>
          </div>

          {threadsLoading && (
            <div className="flex-1 flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <p className="text-xs text-slate-500">
                  Loading conversations…
                </p>
              </div>
            </div>
          )}

          {!threadsLoading && threadsError && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-2">
                <FiAlertCircle className="text-lg" />
              </div>
              <p className="text-sm font-medium text-rose-700">
                Unable to load conversations
              </p>
              <p className="mt-1 text-xs text-rose-500 max-w-xs">
                {threadsError}
              </p>
              <button
                type="button"
                onClick={loadThreads}
                className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {!threadsLoading &&
            !threadsError &&
            filteredThreads.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-2">
                  <FiUser className="text-lg" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  No conversations
                </p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  When patients send you messages, conversations will
                  appear here.
                </p>
              </div>
            )}

          {!threadsLoading &&
            !threadsError &&
            filteredThreads.length > 0 && (
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 -mx-4">
                {filteredThreads.map((thread) => {
                  const selected = thread.id === selectedThreadId;
                  const unread = (thread.unreadCount || 0) > 0;

                  const counterpartName =
                    thread.counterpartName ||
                    thread.otherPartyName ||
                    thread.title ||
                    "Conversation";

                  const initials =
                    thread.counterpartInitials ||
                    counterpartName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                  return (
                    <li key={thread.id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectThread(thread.id)
                        }
                        className={[
                          "w-full flex gap-3 px-4 py-3 text-left transition",
                          selected
                            ? "bg-sky-50/80"
                            : "hover:bg-slate-50/80",
                        ].join(" ")}
                      >
                        <div className="mt-1 h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {counterpartName}
                            </p>
                            <span className="text-[11px] text-slate-500 whitespace-nowrap">
                              {formatTimeOrDate(
                                thread.lastMessageAt
                              )}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {thread.lastMessageSnippet ||
                              "No messages yet"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {renderThreadSubtitle(thread)}
                          </p>
                        </div>
                        {unread && (
                          <div className="self-center flex items-center">
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold text-white">
                              {thread.unreadCount}
                            </span>
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </section>

        {/* Conversation */}
        <section className="card-soft flex flex-col min-h-[420px]">
          {!selectedThread && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-2">
                <FiMail className="text-lg" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                No conversation selected
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Choose a thread on the left to view and reply to
                messages.
              </p>
            </div>
          )}

          {selectedThread && (
            <>
              <header className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-semibold">
                    {(selectedThread.counterpartInitials ||
                      selectedThread.counterpartName ||
                      selectedThread.otherPartyName ||
                      "PT"
                    )
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedThread.counterpartName ||
                        selectedThread.otherPartyName ||
                        selectedThread.title ||
                        "Conversation"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {renderThreadSubtitle(selectedThread)}
                    </p>
                  </div>
                </div>
              </header>

              <div
                ref={scrollRef}
                className="flex-1 min-h-[280px] max-h-[360px] overflow-y-auto space-y-3 pr-1"
              >
                {messagesLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                      <p className="text-xs text-slate-500">
                        Loading conversation…
                      </p>
                    </div>
                  </div>
                )}

                {!messagesLoading && messagesError && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-2">
                      <FiAlertCircle className="text-base" />
                    </div>
                    <p className="text-sm font-medium text-rose-700">
                      Unable to load messages
                    </p>
                    <p className="mt-1 text-xs text-rose-500 max-w-xs">
                      {messagesError}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        loadMessages(selectedThread.id)
                      }
                      className="mt-3 inline-flex items-center rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!messagesLoading &&
                  !messagesError &&
                  messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm font-semibold text-slate-900">
                        No messages yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-xs">
                        Send the first message to start a secure
                        conversation with this patient.
                      </p>
                    </div>
                  )}

                {!messagesLoading &&
                  !messagesError &&
                  messages.length > 0 &&
                  messages.map((msg) => renderMessageBubble(msg))}
              </div>

              <form
                onSubmit={handleSend}
                className="mt-4 pt-3 border-t border-slate-100 flex items-end gap-3"
              >
                <textarea
                  rows={2}
                  className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Type your reply to the patient…"
                  value={composer}
                  onChange={(e) => {
                    setComposer(e.target.value);
                    setMessagesError("");
                  }}
                />
                <button
                  type="submit"
                  disabled={
                    sending || !composer.trim() || messagesLoading
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSend className="text-sm" />
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
