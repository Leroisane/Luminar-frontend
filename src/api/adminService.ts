import { axiosClient } from "./axiosClient";
import type { CalendarEvent, RoomCategory } from "../types/admin";
import { toISODate } from "../utils/helpers";

const todayISO = toISODate(new Date());
const ADMIN_REQUESTS_KEY = "luminar_admin_mock_requests";
const LATEST_BOOKING_KEY = "luminar_latest_booking";

export interface MockAdminRequest {
  id: string;
  applicant: string;
  applicantName: string;
  nim: string;
  organization: string;
  facility: string;
  facilityName: string;
  category: RoomCategory;
  activity: string;
  activityName: string;
  purpose: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  doc: {
    kind: "pdf" | "doc";
    name: string;
    url: string;
  };
}

const DEFAULT_MOCK_REQUESTS: MockAdminRequest[] = [
  {
    id: "REQ-2026-001",
    applicant: "Muhammad Ihsan Fadillah",
    applicantName: "Muhammad Ihsan Fadillah",
    nim: "245150700111023",
    organization: "GDGoC Universitas Brawijaya",
    facility: "Lab Komputer Jaringan (G1.4)",
    facilityName: "Lab Komputer Jaringan (G1.4)",
    category: "Lab Komputer",
    activity: "Study Jam Web & Cloud Architecture",
    activityName: "Study Jam Web & Cloud Architecture",
    purpose: "Study Jam Web & Cloud Architecture",
    date: todayISO,
    time: "09:00 – 12:00",
    status: "pending",
    doc: {
      kind: "pdf",
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
    category: "Auditorium",
    activity: "Seminar Nasional Tech Innovation",
    activityName: "Seminar Nasional Tech Innovation",
    purpose: "Seminar Nasional Tech Innovation",
    date: todayISO,
    time: "13:00 – 16:00",
    status: "approved",
    doc: {
      kind: "pdf",
      name: "Surat_Izin_Auditorium.pdf",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  },
];

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

function mapToRoomCategory(rawCategory: string): RoomCategory {
  if (rawCategory.includes("Lab")) return "Lab Komputer";
  if (rawCategory.includes("Auditorium")) return "Auditorium";
  if (rawCategory.includes("Multimedia") || rawCategory.includes("Audio")) {
    return "Studio & Multimedia";
  }
  return "Ruang Kelas";
}

function getLocalMockRequests(): MockAdminRequest[] {
  let list: MockAdminRequest[];
  try {
    const raw = localStorage.getItem(ADMIN_REQUESTS_KEY);
    list = raw
      ? (JSON.parse(raw) as MockAdminRequest[])
      : [...DEFAULT_MOCK_REQUESTS];
  } catch {
    list = [...DEFAULT_MOCK_REQUESTS];
  }

  // Tarik tiket terbaru dari form mahasiswa jika belum masuk antrean admin
  try {
    const latestRaw = localStorage.getItem(LATEST_BOOKING_KEY);
    if (latestRaw) {
      const latest = JSON.parse(latestRaw) as {
        ticketId: string;
        activity: string;
        resources: string;
        schedule: string;
      };
      if (
        latest.ticketId &&
        !list.some((item) => item.id === latest.ticketId)
      ) {
        const [
          facilityPart = "Fasilitas FILKOM",
          categoryPart = "Ruang Kelas",
        ] = latest.resources.split("•").map((s) => s.trim());
        const timePart =
          latest.schedule.split("•")[1]?.trim() || "09:00 – 12:00";

        list = [
          {
            id: latest.ticketId,
            applicant: "Muhammad Ihsan Fadillah",
            applicantName: "Muhammad Ihsan Fadillah",
            nim: "245150700111023",
            organization: "Mahasiswa FILKOM UB",
            facility: facilityPart,
            facilityName: facilityPart,
            category: mapToRoomCategory(categoryPart),
            activity: latest.activity,
            activityName: latest.activity,
            purpose: latest.activity,
            date: todayISO,
            time: timePart,
            status: "pending",
            doc: {
              kind: "pdf",
              name: `Proposal_${latest.ticketId}.pdf`,
              url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            },
          },
          ...list,
        ];
        localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(list));
      }
    }
  } catch {
    // Abaikan jika JSON tiket mahasiswa tidak valid
  }

  return list;
}

function updateLocalRequestStatus(id: string, status: "approved" | "rejected") {
  const current = getLocalMockRequests();
  const updated = current.map((item) =>
    item.id === id ? { ...item, status } : item,
  );
  localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(updated));

  // Sinkronkan juga ke tampilan StatusSection mahasiswa jika ID tiket cocok
  try {
    const latestRaw = localStorage.getItem(LATEST_BOOKING_KEY);
    if (latestRaw) {
      const latest = JSON.parse(latestRaw);
      if (latest.ticketId === id) {
        latest.status =
          status === "approved"
            ? "Disetujui Admin Sarpras"
            : "Ditolak Admin Sarpras";
        if (Array.isArray(latest.steps) && latest.steps[1]) {
          latest.steps[1].state = status === "approved" ? "done" : "current";
          latest.steps[1].note =
            status === "approved"
              ? "Diverifikasi Admin Sarpras"
              : "Pengajuan ditolak — cek catatan admin";
          if (status === "approved" && latest.steps[2]) {
            latest.steps[2].state = "current";
            latest.steps[2].note = "Menunggu penerbitan surat izin";
          }
        }
        localStorage.setItem(LATEST_BOOKING_KEY, JSON.stringify(latest));
      }
    }
  } catch {
    // Abaikan error sinkronisasi opsional
  }
}

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
        return getLocalMockRequests();
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
    try {
      const response = await axiosClient.patch(
        `/api/v1/admin/requests/${id}/approve`,
      );
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        updateLocalRequestStatus(id, "approved");
        return { success: true, id, status: "approved" };
      }
      throw error;
    }
  },

  rejectRequest: async (id: string) => {
    try {
      const response = await axiosClient.patch(
        `/api/v1/admin/requests/${id}/reject`,
      );
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        updateLocalRequestStatus(id, "rejected");
        return { success: true, id, status: "rejected" };
      }
      throw error;
    }
  },
};

export default adminService;
