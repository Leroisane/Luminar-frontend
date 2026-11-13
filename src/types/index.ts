export type BuildingKey = "G" | "F" | "Kreatif";

export type FacilityCategory =
  | "Ruang Kuliah"
  | "Laboratorium"
  | "Peralatan Multimedia"
  | "Audio System";

export interface Facility {
  id: string;
  name: string;
  image: string;
  location: string;
  specs: string;
  category: FacilityCategory;
  /** jumlah unit tersedia, undefined = ruangan tunggal */
  units?: number;
  requirement: { label: string; value: string };
}

export type SlotIcon = "auditorium" | "lab" | "camera" | "gavel";
export type SlotStatus = "available" | "units" | "reserved";

export interface TimeSlot {
  id: string;
  name: string;
  time: string;
  meta: string;
  icon: SlotIcon;
  status: SlotStatus;
  units?: number;
  reservedBy?: string;
}

export type StepState = "done" | "current" | "pending";

export interface BookingStep {
  id: number;
  title: string;
  timestamp: string;
  note: string;
  description?: string;
  state: StepState;
}

export interface MyBooking {
  ticketId: string;
  status: string;
  submittedAt: string;
  activity: string;
  resources: string;
  schedule: string;
  steps: BookingStep[];
}

export type DayStatus = "available" | "partial" | "full";
