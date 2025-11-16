// src/services/messageService.js
import http from "./http";
import { authService } from "./authService";

// Helper to get the current user id from authService
function getCurrentUserId() {
  try {
    const user = authService.getCurrentUser
      ? authService.getCurrentUser()
      : JSON.parse(localStorage.getItem("user") || "null");

    if (!user) return null;
    return user.id || user.userId || user.user?.id || null;
  } catch {
    return null;
  }
}

// Normalize a raw thread from the API into the shape the UI expects
function normalizeThread(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id;
  const subject = raw.subject || "";
  const lastMessage =
    raw.lastMessage ||
    raw.last_message ||
    null;

  const lastBody = lastMessage?.body || lastMessage?.text || "";
  const lastAt =
    lastMessage?.createdAt ||
    lastMessage?.sentAt ||
    raw.lastActivity ||
    raw.updatedAt ||
    null;

  return {
    id,
    // Used by DoctorMessages as fallback if counterpartName/otherPartyName not present
    title: subject || "Conversation",
    lastMessageSnippet: lastBody,
    lastMessageAt: lastAt,
    unreadCount: raw.unreadCount ?? raw.unread ?? 0,

    // Placeholders for future expansion (patient name, roles, etc.)
    counterpartName: raw.counterpartName || raw.otherPartyName || "",
    counterpartInitials: raw.counterpartInitials || "",
    counterpartRole: raw.counterpartRole || "",
    otherPartyRole: raw.otherPartyRole || "",
  };
}

// Normalize a raw message into the shape the UI expects
function normalizeMessage(raw) {
  if (!raw || typeof raw !== "object") return null;

  const myId = getCurrentUserId();
  const sender = raw.sender || raw.user || {};
  const senderId = sender.id || sender.userId || raw.senderUserId || null;

  const sentAt =
    raw.createdAt ||
    raw.sentAt ||
    raw.timestamp ||
    null;

  let senderName =
    sender.username ||
    sender.name ||
    (sender.role === "DOCTOR" ? "Doctor" : "Patient");

  if (!senderName && typeof raw.senderName === "string") {
    senderName = raw.senderName;
  }

  return {
    id: raw.id,
    body: raw.body || raw.text || "",
    sentAt,
    senderName: senderName || "User",
    isMine: myId != null && senderId === myId,
  };
}

export const messageService = {
  async getUnreadCount() {
    const { data } = await http.get("/messages/unread-count");
    const payload = data?.data || data || {};
    // Backend returns { success: true, data: { unread: number } }
    return payload.unread ?? payload.count ?? payload.total ?? 0;
  },

  // Threads for current user (patient or doctor)
  async listThreads({ cursor, limit = 20, q } = {}) {
    const { data } = await http.get("/messages/threads", {
      params: {
        cursor: cursor || undefined,
        limit,
        q: q || undefined,
      },
    });

    // Backend: { success: true, data: [...], nextCursor }
    const root = data || {};
    const rawList = Array.isArray(root.data)
      ? root.data
      : Array.isArray(root)
      ? root
      : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.threads)
      ? root.threads
      : [];

    const threads = rawList
      .map(normalizeThread)
      .filter(Boolean);

    // For now DoctorMessages/PatientMessages just need the array
    return threads;
  },

  // Detailed thread (currently not heavily used by doctor UI)
  async getThread(threadId, { limit = 20, cursor } = {}) {
    const { data } = await http.get(`/messages/threads/${threadId}`, {
      params: {
        limit,
        cursor: cursor || undefined,
      },
    });
    return data?.data || data;
  },

  // Messages inside a single thread, as a simple array
  async listMessages(threadId, { limit = 20, cursor } = {}) {
    const { data } = await http.get(
      `/messages/threads/${threadId}/messages`,
      {
        params: {
          limit,
          cursor: cursor || undefined,
        },
      }
    );

    // Backend: { success: true, data: [...], nextCursor }
    const root = data || {};
    const rawList = Array.isArray(root.data)
      ? root.data
      : Array.isArray(root)
      ? root
      : Array.isArray(root.items)
      ? root.items
      : [];

    const messages = rawList
      .map(normalizeMessage)
      .filter(Boolean);

    return messages;
  },

  // Send a new message in an existing thread
  async postMessage(threadId, body) {
    const { data } = await http.post(
      `/messages/threads/${threadId}/messages`,
      { body }
    );
    const raw = data?.data || data;
    return normalizeMessage(raw);
  },

  // Alias used by DoctorMessages and patient UI
  async sendMessage(threadId, body) {
    return this.postMessage(threadId, body);
  },

  async markRead(threadId) {
    try {
      await http.post(`/messages/threads/${threadId}/read`, {});
    } catch {
      // non-blocking
    }
  },

  // Alias used by DoctorMessages
  async markThreadRead(threadId) {
    return this.markRead(threadId);
  },

  async listDoctors() {
    const { data } = await http.get("/doctors", {
      params: { limit: 100 },
    });
    const list = data?.data || data;
    const arr = Array.isArray(list)
      ? list
      : Array.isArray(list?.items)
      ? list.items
      : [];

    return arr.map((d) => ({
      id: d.id,
      userId: d.userId || d.user?.id || d.user_id,
      firstName: d.firstName || d.first_name,
      lastName: d.lastName || d.last_name,
      specialization: d.specialization || "",
    }));
  },

  // Backend contract: POST /messages/threads { doctorUserId, subject, body }
  async createThread({ doctorUserId, subject, body }) {
    const { data } = await http.post("/messages/threads", {
      doctorUserId,
      subject,
      body,
    });
    // Right now backend returns { success: true, data: { id } }
    return data?.data || data;
  },
};
