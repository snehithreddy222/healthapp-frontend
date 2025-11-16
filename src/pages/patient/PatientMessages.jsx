// src/pages/patient/PatientMessages.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiEdit, FiSearch, FiChevronRight, FiSend } from "react-icons/fi";
import { format } from "date-fns";
import { messageService } from "../../services/messageService";

/* ---------- helpers ---------- */

function pickOtherParticipant(metaOrThread) {
  if (!metaOrThread) return null;
  const parts = metaOrThread.participants || [];
  if (!parts.length) return null;
  const doctor = parts.find((p) => p.role === "DOCTOR");
  if (doctor) return doctor;
  const meId = metaOrThread.me || metaOrThread.myUserId || metaOrThread.currentUserId;
  if (meId) return parts.find((p) => p.userId !== meId) || parts[0];
  return parts[0];
}

function formatParticipantName(p) {
  if (!p) return null;
  const doc = p.doctor || p.user?.doctor || null;
  const first = doc?.firstName?.trim();
  const last = doc?.lastName?.trim();
  if (first || last) return `Dr. ${[first, last].filter(Boolean).join(" ")}`.trim();
  if (p.user?.displayName) return p.user.displayName;
  if (p.user?.username) return p.user.username;
  return null;
}

function formatParticipantRole(p) {
  if (!p) return "";
  if (p.role === "DOCTOR") {
    const spec = p.doctor?.specialization || p.user?.doctor?.specialization;
    return spec ? spec : "Doctor";
  }
  return p.role || "";
}

function isMine(message, meta) {
  if (typeof message?.isMine === "boolean") return message.isMine;
  if (message?.sender?.role) return message.sender.role === "PATIENT";
  const meId = meta?.me || meta?.myUserId || meta?.currentUserId;
  if (meId && message?.senderUserId) return message.senderUserId === meId;
  return false;
}

/* ---------- UI ---------- */

function Avatar({ name = "", size = 40 }) {
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  return (
    <div
      className="rounded-full bg-gradient-to-br from-sky-200 to-sky-300 text-sky-800 grid place-items-center font-semibold"
      style={{ width: size, height: size }}
      title={name}
    >
      {initial}
    </div>
  );
}

function InboxItem({ active, title, preview, when, unread, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-3 border-b border-gray-200/60 hover:bg-sky-50/50 transition-colors",
        active ? "bg-sky-50 ring-1 ring-sky-200" : "bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Avatar name={title || "T"} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              {title || "Conversation"}
            </p>
            <span className="ml-3 shrink-0 text-sm text-gray-500">{when}</span>
          </div>
          <p
            className={[
              "mt-0.5 text-[13px] truncate",
              unread ? "text-sky-700 font-semibold" : "text-gray-700",
            ].join(" ")}
            title={preview}
          >
            {preview || "—"}
          </p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ mine, text, at }) {
  if (!at) return null;
  return (
    <div className={"mt-3 " + (mine ? "text-right" : "text-left")}>
      <div
        className={[
          "inline-block max-w-[90%] rounded-xl px-4 py-3 text-[15px] leading-relaxed",
          mine ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-800",
        ].join(" ")}
      >
        {text}
      </div>
      <div className="mt-1 text-xs text-gray-500">{format(new Date(at), "PPP p")}</div>
    </div>
  );
}

/* ---------- page ---------- */

const POLL_MS = 4000;

export default function PatientMessages() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState([]);
  const [threadsCursor, setThreadsCursor] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [activeId, setActiveId] = useState(null);
  const [activeMeta, setActiveMeta] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgsCursor, setMsgsCursor] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [sendText, setSendText] = useState("");
  const sendingRef = useRef(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDoctors, setComposeDoctors] = useState([]);
  const [composeDoctorId, setComposeDoctorId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeBusy, setComposeBusy] = useState(false);

  const [otherNameByThread, setOtherNameByThread] = useState({});

  // Initial threads + unread
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingThreads(true);
        const [threadsResult, unread] = await Promise.all([
          messageService.listThreads({ includeParticipants: true }).catch(() => []),
          messageService.getUnreadCount().catch(() => 0),
        ]);
        if (!mounted) return;

        const items = Array.isArray(threadsResult)
          ? threadsResult
          : threadsResult?.items || threadsResult?.threads || [];
        const nextCursor = Array.isArray(threadsResult)
          ? null
          : threadsResult?.nextCursor ?? null;

        setThreads(items);
        setThreadsCursor(nextCursor);
        setUnreadCount(unread);
        if (items.length && !activeId) setActiveId(items[0].id);

        if (!items.length) return;

        const needs = items
          .filter((t) => !(t.participants && t.participants.length))
          .slice(0, 12);

        if (needs.length) {
          const details = await Promise.all(
            needs.map((t) => messageService.getThread(t.id).catch(() => null))
          );
          const map = {};
          details.forEach((th) => {
            if (!th) return;
            const other = pickOtherParticipant(th);
            const name = formatParticipantName(other);
            if (name) map[th.id] = name;
          });
          if (Object.keys(map).length && mounted) {
            setOtherNameByThread((prev) => ({ ...prev, ...map }));
          }
        } else {
          const map = {};
          items.forEach((t) => {
            const other = pickOtherParticipant(t);
            const name = formatParticipantName(other);
            if (name) map[t.id] = name;
          });
          if (Object.keys(map).length && mounted) {
            setOtherNameByThread((prev) => ({ ...prev, ...map }));
          }
        }
      } finally {
        if (mounted) setLoadingThreads(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load active thread messages once when active changes
  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingMsgs(true);
        const thread = await messageService.getThread(activeId, { limit: 20 });
        if (!mounted) return;
        setActiveMeta(thread);
        setMsgs(thread?.messages || []);
        setMsgsCursor(null);

        const other = pickOtherParticipant(thread);
        const name = formatParticipantName(other);
        if (name) {
          setOtherNameByThread((prev) =>
            prev[thread.id] ? prev : { ...prev, [thread.id]: name }
          );
        }

        messageService.markRead(activeId).finally(async () => {
          const n = await messageService.getUnreadCount().catch(() => null);
          if (n !== null && mounted) setUnreadCount(n);
        });
      } finally {
        if (mounted) setLoadingMsgs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeId]);

  // Polling for threads + active conversation
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    async function tick() {
      try {
        const [threadsResult, messages, unread] = await Promise.all([
          messageService.listThreads({ limit: 20 }).catch(() => []),
          messageService.listMessages(activeId, { limit: 50 }).catch(() => []),
          messageService.getUnreadCount().catch(() => 0),
        ]);

        if (cancelled) return;

        const items = Array.isArray(threadsResult)
          ? threadsResult
          : threadsResult?.items || [];
        setThreads(items);
        setMsgs(Array.isArray(messages) ? messages : []);
        setUnreadCount(unread);
      } catch {
        // silent
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
  }, [activeId]);

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter((t) => {
      const subject = (t.subject || t.title || "").toLowerCase();
      const preview = (
        t.lastMessage?.body ||
        t.lastMessageSnippet ||
        ""
      ).toLowerCase();
      const otherName = (otherNameByThread[t.id] || "").toLowerCase();
      return (
        subject.includes(q) ||
        preview.includes(q) ||
        otherName.includes(q)
      );
    });
  }, [threads, query, otherNameByThread]);

  const active = useMemo(
    () =>
      Array.isArray(filteredThreads)
        ? filteredThreads.find((t) => t.id === activeId) || filteredThreads[0] || null
        : null,
    [filteredThreads, activeId]
  );

  function threadDisplayTitle(t) {
    const cached = otherNameByThread[t.id];
    if (cached) return cached;
    if (t.participants?.length) {
      const other = pickOtherParticipant(t);
      const name = formatParticipantName(other);
      if (name) return name;
    }
    return t.subject || t.title || "Conversation";
  }

  const loadOlder = async () => {
    if (!activeId || sendingRef.current) return;
    const res = await messageService.listMessages(activeId, {
      cursor: msgsCursor || undefined,
      limit: 20,
    });

    const items = Array.isArray(res) ? res : res.items || [];
    const nextCursor = Array.isArray(res) ? null : res.nextCursor ?? null;

    if (items.length) setMsgs((prev) => [...items, ...prev]);
    setMsgsCursor(nextCursor);
  };

  const onSend = async (e) => {
    e.preventDefault();
    const text = sendText.trim();
    if (!text || !activeId || sendingRef.current) return;
    sendingRef.current = true;
    try {
      const created = await messageService.postMessage(activeId, text);
      setSendText("");
      if (created) setMsgs((prev) => [...prev, created]);

      const threadsResult = await messageService.listThreads({ limit: 20 });
      const items = Array.isArray(threadsResult)
        ? threadsResult
        : threadsResult?.items || [];
      const nextCursor = Array.isArray(threadsResult)
        ? null
        : threadsResult?.nextCursor ?? null;

      setThreads(items);
      setThreadsCursor(nextCursor);
    } finally {
      sendingRef.current = false;
    }
  };

  const openCompose = async () => {
    setComposeOpen(true);
    try {
      const doctors = await messageService.listDoctors();
      setComposeDoctors(doctors || []);
    } catch {
      setComposeDoctors([]);
    }
  };

  const submitCompose = async (e) => {
    e.preventDefault();
    if (!composeDoctorId || !composeSubject.trim() || !composeBody.trim()) return;
    setComposeBusy(true);
    try {
      const thread = await messageService.createThread({
        doctorUserId: composeDoctorId,
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });

      const threadsResult = await messageService.listThreads({ limit: 20 });
      const items = Array.isArray(threadsResult)
        ? threadsResult
        : threadsResult?.items || [];
      const nextCursor = Array.isArray(threadsResult)
        ? null
        : threadsResult?.nextCursor ?? null;

      setThreads(items);
      setThreadsCursor(nextCursor);

      if (thread?.id) setActiveId(thread.id);
      setComposeDoctorId("");
      setComposeSubject("");
      setComposeBody("");
      setComposeOpen(false);
    } finally {
      setComposeBusy(false);
    }
  };

  const other = useMemo(() => pickOtherParticipant(activeMeta), [activeMeta]);
  const otherName = useMemo(() => formatParticipantName(other), [other]);
  const otherRole = useMemo(() => formatParticipantRole(other), [other]);

  return (
    <div className="px-6 pb-10 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mt-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight">Messages</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-sky-700">
              {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn-primary flex items-center gap-2 w-auto px-4 h-11"
          onClick={openCompose}
        >
          <FiEdit className="text-white text-[18px]" />
          Compose Message
        </button>
      </div>

      {/* Split */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* LEFT: Inbox */}
        <div className="col-span-12 lg:col-span-5">
          <div className="card-soft p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/70">
              <div className="font-semibold">Inbox</div>
              <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full">
                {threads.length} Total
              </span>
            </div>

            <div className="px-4 py-3 border-b border-gray-200/70">
              <div className="search-pill">
                <FiSearch className="text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subject or last message…"
                  className="search-input"
                />
              </div>
            </div>

            <div className="max-h-[580px] overflow-auto">
              {loadingThreads && (
                <div className="px-4 py-6 text-gray-500">Loading threads…</div>
              )}

              {!loadingThreads &&
                Array.isArray(filteredThreads) &&
                filteredThreads.map((t) => {
                  const preview =
                    t.lastMessageSnippet ||
                    t.lastMessage?.body ||
                    "";
                  const whenSource =
                    t.lastMessageAt ||
                    t.lastActivity ||
                    t.updatedAt ||
                    null;

                  const when = whenSource
                    ? format(new Date(whenSource), "d MMM")
                    : "";

                  return (
                    <InboxItem
                      key={t.id}
                      active={t.id === (active && active.id)}
                      title={threadDisplayTitle(t)}
                      preview={preview}
                      when={when}
                      unread={(t.unreadCount ?? 0) > 0}
                      onClick={() => setActiveId(t.id)}
                    />
                  );
                })}

              {!loadingThreads &&
                Array.isArray(filteredThreads) &&
                filteredThreads.length === 0 && (
                  <div className="px-4 py-10 text-center text-gray-500">
                    No messages found.
                  </div>
                )}

              {threadsCursor && (
                <button
                  className="w-full py-3 text-sm text-sky-700 hover:underline"
                  onClick={async () => {
                    const res = await messageService.listThreads({
                      cursor: threadsCursor,
                      limit: 20,
                    });
                    const items = Array.isArray(res)
                      ? res
                      : res.items || [];
                    const nextCursor = Array.isArray(res)
                      ? null
                      : res.nextCursor ?? null;
                    setThreads((prev) => [...prev, ...items]);
                    setThreadsCursor(nextCursor);
                  }}
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Conversation */}
        <div className="col-span-12 lg:col-span-7">
          <div className="card-soft">
            {!active ? (
              <div className="py-16 text-center text-gray-500">
                Select a conversation to view messages.
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200/70">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={otherName || active?.subject || active?.title || "Conversation"}
                      size={44}
                    />
                    <div>
                      <div className="font-semibold text-[17px]">
                        {otherName || active?.subject || active?.title || "Conversation"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {otherRole
                          ? otherRole
                          : activeMeta?.participants?.length
                          ? `${activeMeta.participants.length} participants`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <button className="inline-flex items-center text-sm text-sky-700 hover:text-sky-800">
                    View Visit Summary
                    <FiChevronRight className="ml-1" />
                  </button>
                </div>

                {/* Messages */}
                <div className="pt-4">
                  {loadingMsgs && msgs.length === 0 && (
                    <div className="text-gray-500">Loading messages…</div>
                  )}

                  {msgsCursor && (
                    <button
                      className="text-sky-700 text-sm hover:underline"
                      onClick={loadOlder}
                    >
                      Load older messages
                    </button>
                  )}

                  {msgs.map((m) => (
                    <MessageBubble
                      key={m.id}
                      mine={isMine(m, activeMeta)}
                      text={m.body}
                      at={m.createdAt || m.sentAt}
                    />
                  ))}
                </div>

                {/* Composer */}
                <form onSubmit={onSend} className="mt-6 flex items-center gap-2">
                  <input
                    value={sendText}
                    onChange={(e) => setSendText(e.target.value)}
                    placeholder="Type your message…"
                    className="input flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary h-12 px-4 rounded-lg inline-flex items-center gap-2"
                  >
                    <FiSend />
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compose sheet */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="text-lg font-semibold mb-4">New message</div>
            <form onSubmit={submitCompose} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">To doctor</label>
                <select
                  className="input mt-1 w-full"
                  value={composeDoctorId}
                  onChange={(e) => setComposeDoctorId(e.target.value)}
                >
                  <option value="">Select a doctor…</option>
                  {composeDoctors.map((d) => (
                    <option key={d.userId || d.id} value={d.userId || d.id}>
                      {`Dr. ${[d.firstName, d.lastName].filter(Boolean).join(" ")}`}
                      {d.specialization ? ` • ${d.specialization}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input
                  className="input mt-1 w-full"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  className="input mt-1 w-full min-h-[120px]"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message…"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setComposeOpen(false)}
                  disabled={composeBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={composeBusy}>
                  {composeBusy ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
