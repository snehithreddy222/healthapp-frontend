// src/services/testResultsService.js
import http from "./http";

export const testResultsService = {
  async list({ q, cursor, limit = 20 } = {}) {
    const params = {};
    if (q) params.q = q;
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;

    const { data } = await http.get("/test-results", { params });

    const root = data || {};

    // Support multiple backend shapes
    let items = [];
    if (Array.isArray(root.data)) {
      items = root.data;
    } else if (Array.isArray(root.items)) {
      items = root.items;
    } else if (Array.isArray(root.results)) {
      items = root.results;
    } else if (Array.isArray(root)) {
      items = root;
    } else if (Array.isArray(root.data?.items)) {
      items = root.data.items;
    }

    const nextCursor =
      root.nextCursor ||
      root.data?.nextCursor ||
      null;

    return {
      items,
      nextCursor,
    };
  },

  async getOne(id) {
    const { data } = await http.get(`/test-results/${id}`);
    return data?.data || data || null;
  },

  downloadUrl(id) {
    // Let the browser follow the redirect
    return `${http.defaults.baseURL}/test-results/${id}/download`;
  },
};
