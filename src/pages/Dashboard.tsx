import { useState } from "react";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import HeroSection, {
  type SearchPayload,
} from "../components/dashboard/HeroSection";
import ScheduleSection from "../components/dashboard/ScheduleSection";
import CatalogSection from "../components/dashboard/CatalogSection";
import StatusSection from "../components/dashboard/StatusSection";
import DashboardFooter from "../components/dashboard/DashboardFooter";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = ({ query, date }: SearchPayload) => {
    setSearchQuery(query);
    setSelectedDate(date);
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
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
        <CatalogSection searchQuery={searchQuery} />
        <StatusSection />
      </main>
      <DashboardFooter />
    </div>
  );
}
