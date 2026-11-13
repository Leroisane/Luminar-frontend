export type EventKind = "class" | "auditorium" | "studio" | "maintenance";

export type RoomCategory =
  | "Auditorium"
  | "Lab Komputer"
  | "Ruang Kelas"
  | "Studio & Multimedia";

export interface CalendarEvent {
  id: string;
  /** ISO yyyy-mm-dd */
  date: string;
  time?: string;
  title: string;
  kind: EventKind;
  /** null = blokir/maintenance, selalu tampil di semua filter */
  category: RoomCategory | null;
}

export type RequestCategory =
  | "Auditorium"
  | "Laboratorium"
  | "Ruang Kelas"
  | "Peralatan Multimedia";

export type AvatarTone = "blue" | "green" | "violet" | "amber";

export interface BookingRequest {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  /** NIM / NIP */
  identifier: string;
  org: string;
  room: string;
  roomMeta: string;
  date: string;
  time: string;
  category: RequestCategory;
  doc: { name: string; kind: "pdf" | "memo" };
}

export type Decision = "approved" | "rejected";
