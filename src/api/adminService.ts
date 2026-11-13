import { axiosClient } from "./axiosClient";

export const adminService = {
  getRequests: async () => {
    const response = await axiosClient.get("/api/v1/admin/requests");
    return response.data;
  },

  getEvents: async (from: string, to: string) => {
    const response = await axiosClient.get("/api/v1/admin/events", {
      params: { from, to },
    });
    return response.data;
  },

  approveRequest: async (id: string) => {
    const response = await axiosClient.patch(
      `/api/v1/admin/requests/${id}/approve`,
    );
    return response.data;
  },

  rejectRequest: async (id: string) => {
    const response = await axiosClient.patch(
      `/api/v1/admin/requests/${id}/reject`,
    );
    return response.data;
  },
};

export default adminService;
