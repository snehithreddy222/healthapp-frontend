// src/pages/patient/PatientMessages.jsx
import React, { useMemo, useState } from "react";
import { FiEdit, FiSearch, FiChevronRight } from "react-icons/fi";
import { format } from "date-fns";

const MOCK_THREADS = [
  {
    id: "t1",
    contact: {
      name: "Dr. Alan Grant",
      role: "Family Medicine",
      avatar: null, // use initials
    },
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    unread: true,
    subject: "Regarding your recent lab results…",
    preview:
      "I have reviewed your recent blood work results, and I would like to discuss them with you…",
    messages: [
      {
        id: "m1",
        from: "doctor",
        text:
          "Hi Maria, I have reviewed your recent blood work results, and I would like to discuss them with you. Overall, things are looking good, but there are a couple of markers we should monitor. Your cholesterol levels are slightly elevated. I'd recommend we focus on dietary adjustments for the next three months and then re-test. Please find the detailed results attached.",
        at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      },
      {
        id: "m2",
        from: "me",
        text:
          "Thank you, Dr. Grant. I've received the results. I will schedule a follow-up appointment to discuss the dietary plan. I appreciate you looking out for me.",
        at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "t2",
    contact: { name: "Appointment Reminder", role: "", avatar: null },
    lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    unread: false,
    subject: "Your appointment is confirmed.",
    preview:
      "This is a reminder for your upcoming annual physical exam scheduled for 10:30 AM…",
    messages: [],
  },
  {
    id: "t3",
    contact: { name: "Dr. Ian Malcolm", role: "", avatar: null },
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    unread: false,
    subject: "Follow-up on your medication",
    preview: "Hi Maria, I am just checking in to see how you’re feeling…",
    messages: [],
  },
];

function Avatar({ name, size = 40 }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  return (
    <div
      className="rounded-full bg-gradient-to-br from-sky-200 to-sky-300 text-sky-800 grid place-items-center font-semibold"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

function InboxItem({ active, unread, name, subject, preview, when, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-3 border-b border-gray-200/60 hover:bg-sky-50/50 transition-colors",
        active ? "bg-sky-50 ring-1 ring-sky-200" : "bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              {name}
            </p>
            <span className="ml-3 shrink-0 text-sm text-gray-500">
              {when}
            </span>
          </div>
          <p
            className={[
              "mt-0.5 text-[13px] truncate",
              unread ? "text-sky-700 font-semibold" : "text-gray-700",
            ].join(" ")}
            title={subject}
          >
            {subject}
          </p>
          <p className="mt-0.5 text-[13px] text-gray-500 truncate">{preview}</p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ from, text, at }) {
  const mine = from === "me";
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
      <div className="mt-1 text-xs text-gray-500">
        {format(at, "PPP p")}
      </div>
    </div>
  );
}

export default function PatientMessages() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(MOCK_THREADS[0].id);

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_THREADS;
    const q = query.toLowerCase();
    return MOCK_THREADS.filter(
      (t) =>
        t.contact.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q)
    );
  }, [query]);

  const active =
    filtered.find((t) => t.id === activeId) || filtered[0] || null;

  const unreadCount = MOCK_THREADS.filter((t) => t.unread).length;

  return (
    <div className="px-6 pb-10 mx-auto max-w-7xl">
      {/* Page header row */}
      <div className="flex items-center justify-between mt-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight">Messages</h1>
          <p className="text-gray-600">
            You have <span className="font-semibold">{unreadCount}</span>{" "}
            unread messages.
          </p>
        </div>

        <button className="btn-primary flex items-center gap-2 w-auto px-4 h-11">
          <FiEdit className="text-white text-[18px]" />
          Compose Message
        </button>
      </div>

      {/* Content split */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* LEFT: Inbox */}
        <div className="col-span-12 lg:col-span-5">
          <div className="card-soft p-0">
            {/* Inbox header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/70">
              <div className="font-semibold">Inbox</div>
              <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full">
                {MOCK_THREADS.length} Total
              </span>
            </div>

            {/* Search in inbox */}
            <div className="px-4 py-3 border-b border-gray-200/70">
              <div className="search-pill">
                <FiSearch className="text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages…"
                  className="search-input"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[580px] overflow-auto">
              {filtered.map((t) => (
                <InboxItem
                  key={t.id}
                  active={t.id === active?.id}
                  unread={t.unread}
                  name={t.contact.name}
                  subject={t.subject}
                  preview={t.preview}
                  when={format(t.lastActivity, "d MMM")}
                  onClick={() => setActiveId(t.id)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-10 text-center text-gray-500">
                  No messages found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Conversation */}
        <div className="col-span-12 lg:col-span-7">
          <div className="card-soft">
            {active ? (
              <>
                {/* Conversation header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200/70">
                  <div className="flex items-center gap-3">
                    <Avatar name={active.contact.name} size={44} />
                    <div>
                      <div className="font-semibold text-[17px]">
                        {active.contact.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {active.contact.role || "—"}
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
                  {active.messages.map((m) => (
                    <MessageBubble key={m.id} from={m.from} text={m.text} at={m.at} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-gray-500">
                Select a conversation to view messages.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
