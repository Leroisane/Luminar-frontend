import { useState } from "react";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import HeroSection, {
  type SearchPayload,
} from "../components/dashboard/HeroSection";
import ScheduleSection from "../components/dashboard/ScheduleSection";
import CatalogSection from "../components/dashboard/CatalogSection";
import StatusSection from "../components/dashboard/StatusSection";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import BookingModal, {
  type SubmittedBooking,
} from "../components/dashboard/BookingModal";
import type { Facility } from "../types";

function getStoredBooking(): SubmittedBooking | null {
  try {
    const raw = localStorage.getItem("luminar_latest_booking");
    return raw ? (JSON.parse(raw) as SubmittedBooking) : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [latestBooking, setLatestBooking] = useState<SubmittedBooking | null>(
    getStoredBooking,
  );

  const handleSearch = ({ query, date }: SearchPayload) => {
    setSearchQuery(query);
    setSelectedDate(date);
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = (newBooking: SubmittedBooking) => {
    setLatestBooking(newBooking);
    document.getElementById("riwayat")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      <DashboardNavbar />
      <main className="flex-1">
        <HeroSection selectedDate={selectedDate} onSearch={handleSearch} />
        <ScheduleSection
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <CatalogSection
          searchQuery={searchQuery}
          onSelectFacility={handleSelectFacility}
        />
        <StatusSection
          latestBooking={latestBooking}
          onClearLatestBooking={() => setLatestBooking(null)}
        />
      </main>
      <DashboardFooter />

      <BookingModal
        key={`${selectedFacility?.id ?? "none"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedFacility={selectedFacility}
        defaultDate={selectedDate}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
