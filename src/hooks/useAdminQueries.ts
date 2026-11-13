import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminService } from "../api/adminService";

export const useAdminRequests = () =>
  useQuery({
    queryKey: ["admin", "requests"],
    queryFn: adminService.getRequests,
  });

export const useCalendarEvents = (from: string, to: string) =>
  useQuery({
    queryKey: ["admin", "events", from, to],
    queryFn: () => adminService.getEvents(from, to),
    placeholderData: keepPreviousData,
  });
