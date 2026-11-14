import { axiosClient } from "./axiosClient";
import type { CalendarEvent } from "../types/admin";
import { toISODate } from "../utils/helpers";

const todayISO = toISODate(new Date());

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "EVT-001",
    title: "Workshop GDGoC UB - Lab G1.4",
    date: todayISO,
    time: "09:00",
    kind: "class",
    category: "Lab Komputer",
  },
  {
    id: "EVT-002",
    title: "Seminar Tech Career - Auditorium G2",
    date: todayISO,
    time: "13:00",
    kind: "auditorium",
    category: "Auditorium",
  },
  {
    id: "EVT-003",
    title: "Produksi Konten BEM - Studio Multimedia",
    date: todayISO,
    time: "15:30",
    kind: "studio",
    category: "Studio & Multimedia",
  },
];

const MOCK_REQUESTS = [
  {
    id: "REQ-2026-001",
    applicant: "Muhammad Ihsan Fadillah",
    applicantName: "Muhammad Ihsan Fadillah",
    nim: "245150700111023",
    organization: "GDGoC Universitas Brawijaya",
    facility: "Lab Komputer Jaringan (G1.4)",
    facilityName: "Lab Komputer Jaringan (G1.4)",
    category: "Lab Komputer" as const,
    activity: "Study Jam Web & Cloud Architecture",
    activityName: "Study Jam Web & Cloud Architecture",
    purpose: "Study Jam Web & Cloud Architecture",
    date: todayISO,
    time: "09:00 – 12:00",
    status: "pending" as const,
    doc: {
      kind: "pdf" as const,
      name: "Proposal_StudyJam_GDGoC.pdf",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  },
  {
    id: "REQ-2026-002",
    applicant: "Audrey Khansa Larasati",
    applicantName: "Audrey Khansa Larasati",
    nim: "245150701111031",
    organization: "BEM FILKOM UB",
    facility: "Auditorium Algoritma G2",
    facilityName: "Auditorium Algoritma G2",
    category: "Auditorium" as const,
    activity: "Seminar Nasional Tech Innovation",
    activityName: "Seminar Nasional Tech Innovation",
    purpose: "Seminar Nasional Tech Innovation",
    date: todayISO,
    time: "13:00 – 16:00",
    status: "approved" as const,
    doc: {
      kind: "pdf" as const,
      name: "Surat_Izin_Auditorium.pdf",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  },
];

export const adminService = {
  getRequests: async () => {
    try {
      const response = await axiosClient.get("/api/v1/admin/requests");
      const payload = response.data?.data ?? response.data;
      if (!Array.isArray(payload)) {
        throw new Error("Respons API requests bukan array");
      }
      return payload;
    } catch (error) {
      if (import.meta.env.DEV) {
        return MOCK_REQUESTS;
      }
      throw error;
    }
  },

  getEvents: async (from: string, to: string): Promise<CalendarEvent[]> => {
    try {
      const response = await axiosClient.get("/api/v1/admin/events", {
        params: { from, to },
      });
      const payload = response.data?.data ?? response.data;
      if (!Array.isArray(payload)) {
        throw new Error("Respons API events bukan array");
      }
      return payload;
    } catch (error) {
      if (import.meta.env.DEV) {
        return MOCK_EVENTS;
      }
      throw error;
    }
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
