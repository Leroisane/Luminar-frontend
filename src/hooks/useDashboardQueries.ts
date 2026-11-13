import { useQuery } from "@tanstack/react-query";
import { facilityService } from "../api/facilityService";
import type { BuildingKey } from "../types";

export const useFacilities = () =>
  useQuery({
    queryKey: ["facilities"],
    queryFn: facilityService.getFacilities,
  });

export const useSlots = (date: string, building: BuildingKey) =>
  useQuery({
    queryKey: ["slots", date, building],
    queryFn: () => facilityService.getSlots(date, building),
  });

export const useMyBooking = () =>
  useQuery({ queryKey: ["my-booking"], queryFn: facilityService.getMyBooking });
