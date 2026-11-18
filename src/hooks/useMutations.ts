/**
 * useMutations.ts
 * Semua mutasi (create, update, delete, ubah status) pakai useMutation dari React Query.
 * Setiap hook mengembalikan objek mutasi siap pakai + invalidasi cache otomatis.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBookingApi,
  cancelBookingApi,
  resubmitBookingApi,
  updateRevisionBookingApi,
  type CreateBookingPayload,
} from "../api/facilityService";
import {
  updateBookingStatusApi,
  uploadFinalLetterApi,
  createAdminRoomApi,
  updateAdminRoomApi,
  deleteAdminRoomApi,
  patchAdminRoomStatusApi,
  createAdminItemApi,
  updateAdminItemApi,
  deleteAdminItemApi,
  patchAdminItemStatusApi,
  createAdminLembagaApi,
  updateAdminLembagaApi,
  deleteAdminLembagaApi,
  type UpdateBookingStatusPayload,
  type RoomPayload,
  type ItemPayload,
  type LembagaPayload,
} from "../api/adminService";

// ======================= MAHASISWA =======================

/** Submit booking baru */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBookingApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

/** Batalkan booking milik mahasiswa sendiri */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBookingApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
      void qc.invalidateQueries({ queryKey: ["booking-detail"] });
    },
  });
}

/** Resubmit setelah revisi */
export function useResubmitBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resubmitBookingApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-bookings"] });
      void qc.invalidateQueries({ queryKey: ["booking-detail"] });
    },
  });
}

/** Update data booking saat proses revisi */
export function useUpdateRevisionBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateBookingPayload>;
    }) => updateRevisionBookingApi(id, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["booking-detail", variables.id] });
    },
  });
}

// ======================= ADMIN BOOKING =======================

/** Ubah status booking (approve/reject/review/hand_over/return) */
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBookingStatusPayload;
    }) => updateBookingStatusApi(id, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      void qc.invalidateQueries({
        queryKey: ["admin", "booking-detail", variables.id],
      });
      void qc.invalidateQueries({ queryKey: ["admin", "booking-stats"] });
    },
  });
}

/** Upload surat akhir (PDF) dengan progress callback */
export function useUploadFinalLetter(onProgress?: (pct: number) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadFinalLetterApi(id, file, "file", onProgress),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["admin", "booking-detail", variables.id],
      });
      void qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
  });
}

// ======================= ADMIN – ROOMS =======================

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoomPayload) => createAdminRoomApi(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<RoomPayload>;
    }) => updateAdminRoomApi(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminRoomApi(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function usePatchRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "tersedia" | "rusak" | "nonaktif";
    }) => patchAdminRoomStatusApi(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

// ======================= ADMIN – ITEMS =======================

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ItemPayload) => createAdminItemApi(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ItemPayload>;
    }) => updateAdminItemApi(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminItemApi(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });
}

export function usePatchItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "tersedia" | "rusak" | "nonaktif";
    }) => patchAdminItemStatusApi(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "items"] }),
  });
}

// ======================= ADMIN – LEMBAGA =======================

export function useCreateLembaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LembagaPayload) => createAdminLembagaApi(payload),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin", "lembaga"] }),
  });
}

export function useUpdateLembaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LembagaPayload>;
    }) => updateAdminLembagaApi(id, payload),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin", "lembaga"] }),
  });
}

export function useDeleteLembaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminLembagaApi(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin", "lembaga"] }),
  });
}
