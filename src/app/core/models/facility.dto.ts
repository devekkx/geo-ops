export interface FacilityDto {
  id: string;
  name: string;
  type: string;
  status: string;
  updated: string;
  lat: number;
  lng: number;
  region?: string;
  manager?: string;
  capacity?: string;
  description?: string;
}
