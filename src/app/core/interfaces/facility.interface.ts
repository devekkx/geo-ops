export type FacilityStatus = "active" | "inactive" | "maintenance";

export interface Facility {
  id: string;
  name: string;
  type: string;
  status: FacilityStatus;
  updatedAt: string;
  latitude: number;
  longitude: number;
  region?: string;
  manager?: string;
  capacity?: string;
  description?: string;
}

export type FacilityDraft = Omit<Facility, "id" | "updatedAt">;

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
