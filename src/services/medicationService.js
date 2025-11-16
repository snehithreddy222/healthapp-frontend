// frontend/src/services/medicationService.js
import http from "./http";

export const medicationService = {
  async list() {
    const { data } = await http.get("/medications");
    return data?.data || [];
  },
};
