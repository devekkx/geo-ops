import type { FacilityStatus } from "@core/interfaces/facility";

export const FACILITY_STATUSES: FacilityStatus[] = ["active", "inactive", "maintenance"];

export const FACILITY_TYPES: string[] = [
  "Data Center",
  "Solar Plant",
  "Network Tower",
  "Training Hub",
  "Substation",
  "Water Facility",
  "Warehouse",
  "Office",
  "Clinic"
];

export const FACILITY_STATUS_COLORS: Record<FacilityStatus, string> = {
  active: "#007d00",
  inactive: "#6b6b6b",
  maintenance: "#b45309"
};
