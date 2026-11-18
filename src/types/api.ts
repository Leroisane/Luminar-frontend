// === API ENVELOPE ===
export interface ApiResponse<T> {
  message: string;
  data: T;
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
}

// === ROOM ===
export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  status: "tersedia" | "rusak" | "nonaktif";
  status_note?: string;
  description?: string;
  is_active: boolean;
  location?: string;
  specs?: string;
  category?: string;
}

export interface RoomSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// === ITEM ===
export interface Item {
  id: string;
  name: string;
  category?: string;
  description?: string;
  stock_total: number;
  stock_available: number;
  status: "tersedia" | "rusak" | "nonaktif";
  status_note?: string;
  is_active: boolean;
  stock?: number;
  quantity?: number;
  location?: string;
}

// === BOOKING ===
export type BookingStatus =
  | "pending"
  | "review"
  | "perlu_revisi"
  | "menunggu_ttd"
  | "approved"
  | "rejected"
  | "cancelled"
  | "hand_over"
  | "return";

export interface BookingItemDetail {
  id?: string;
  item_id: string;
  item_name?: string;
  quantity: number;
}

export interface Booking {
  id: string;
  ticket_code: string;
  status: BookingStatus;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  agenda?: string;
  program_kerja?: string;
  participants?: number;
  created_at: string;
  room_id?: string;
  room?: Room;
  lembaga_id?: string;
  lembaga?: Lembaga;
  user_id?: string;
  user?: AuthUser;
  items?: BookingItemDetail[];
  revision_note?: string;
  rejection_reason?: string;
  document_url?: string;
  final_letter_url?: string;
  // Legacy / UI aliases
  ticketCode?: string;
  rawStatus?: string;
  org?: string;
  programKerja?: string;
}

// === AUDIT LOG ===
export interface AuditLog {
  id: string;
  user_name: string;
  role: string;
  action: string;
  target_type: string;
  target_id: string;
  description: string;
  ip_address?: string;
  created_at: string;
  timestamp?: string;
  actor_name?: string;
  target?: string;
  entity?: string;
}

// === REPORT & STATS ===
export interface DashboardStats {
  // Backend snake_case fields
  total_bookings?: number;
  pending_bookings?: number;
  approved_bookings?: number;
  active_facilities?: number;
  // Additional fields returned by the stats endpoint
  review_bookings?: number;
  waiting_signature?: number;
  needs_revision?: number;
  rejected_bookings?: number;
  // Computed aliases used by AdminStatsCards (populated by hook transformer)
  total?: number;
  pending?: number;
  review?: number;
  waitingSignature?: number;
  needsRevision?: number;
  approved?: number;
  rejected?: number;
}
