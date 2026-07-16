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
