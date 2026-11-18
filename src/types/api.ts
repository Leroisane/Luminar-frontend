// === API ENVELOPE ===
export interface ApiResponse<T> {
  success?: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}

// === PAGINATION ===
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// === AUTH ===
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "mahasiswa" | "admin";
  nim?: string;
  phone?: string;
  program_studi?: string;
  is_active?: boolean;
}

export interface LoginResponseData {
  user: AuthUser;
  token?: string;
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface RegisterResponseData {
  user: AuthUser;
  token?: string;
}

// === LEMBAGA ===
export interface Lembaga {
  id: string;
  name: string;
  is_active: boolean;
  code?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// === ROOM ===
// Backend model uses "location" (not "building")
// Status values: "tersedia" | "renovasi" | "nonaktif"
export interface Room {
  id: string;
  name: string;
  location: string;                           // primary — from backend
  capacity: number;
  status: "tersedia" | "renovasi" | "nonaktif";
  status_note?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy compat alias (some old UI components may read "building")
  building?: string;
  specs?: string;
  category?: string;
}

export interface RoomSlot {
  start_time: string;
  end_time: string;
  state?: "kosong" | "menunggu" | "terkunci";   // from AvailabilitySlot DTO
  is_available?: boolean;                        // legacy alias
}

// === ITEM ===
// Backend model: name, category (required), stock_total, status, status_note
export interface Item {
  id: string;
  name: string;
  category: string;
  description?: string;
  stock_total: number;
  stock_available?: number;
  status: "tersedia" | "rusak" | "nonaktif";
  status_note?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy aliases
  stock?: number;
  quantity?: number;
  location?: string;
}

// === BOOKING ===
// Backend status values used in state machine
export type BookingStatus =
  | "diajukan"
  | "direview"
  | "perlu_revisi"
  | "menunggu_ttd"
  | "disetujui"
  | "ditolak"
  | "dibatalkan"
  | "serah_terima"
  | "dikembalikan"
  // Legacy aliases kept for existing UI components
  | "pending"
  | "review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "hand_over"
  | "return";

// Backend action values for changing status (AdminChangeStatusRequest)
export type BookingAction = "review" | "request_revision" | "approve" | "reject" | "cancel";

export interface BookingItemDetail {
  id?: string;
  item_id: string;
  item_name?: string;
  quantity: number;
}

export interface StatusHistory {
  id?: string;
  status: BookingStatus;
  note?: string;
  changed_by?: string;
  changed_at?: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  booking_no?: string;
  ticket_code?: string;        // legacy alias
  status: BookingStatus;
  booking_date?: string;       // primary backend field
  date?: string;               // legacy alias
  start_time: string;
  end_time: string;
  purpose?: string;
  agenda?: string;
  program_kerja?: string;
  participants?: number;
  requester_contact?: string;  // primary backend field
  pic_phone?: string;          // legacy alias
  document_url?: string;
  final_letter_url?: string;
  created_at: string;
  updated_at?: string;
  room_id?: string;
  room?: Room;
  room_name?: string;
  lembaga_id?: string;
  lembaga?: Lembaga;
  lembaga_name?: string;
  user_id?: string;
  user?: AuthUser;
  requester_name?: string;
  requester_nim?: string;
  requester_prodi?: string;
  items?: BookingItemDetail[];
  history?: StatusHistory[];
  revision_note?: string;
  rejection_reason?: string;
  note?: string;
  // Legacy UI aliases
  ticketCode?: string;
  rawStatus?: string;
  org?: string;
  programKerja?: string;
}

// === AUDIT LOG ===
export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  role: string;
  action: string;
  target_type: string;
  target_id?: string;
  description: string;
  ip_address?: string;
  created_at: string;
  // Legacy aliases
  timestamp?: string;
  actor_name?: string;
  target?: string;
  entity?: string;
}

// === REPORT & STATS ===
// Backend AdminRoomBookingStats DTO fields (snake_case Indonesian names)
export interface DashboardStats {
  total?: number;
  diajukan?: number;
  direview?: number;
  perlu_revisi?: number;
  menunggu_ttd?: number;
  disetujui?: number;
  ditolak?: number;
  dibatalkan?: number;
  // Legacy aliases for existing UI components
  total_bookings?: number;
  pending_bookings?: number;
  approved_bookings?: number;
  active_facilities?: number;
  review_bookings?: number;
  waiting_signature?: number;
  needs_revision?: number;
  rejected_bookings?: number;
  pending?: number;
  review?: number;
  waitingSignature?: number;
  needsRevision?: number;
  approved?: number;
  rejected?: number;
}
