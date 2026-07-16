import type { FacilityDto } from "@core/dtos/facility";
import type { Facility, FacilityStatus } from "@core/interfaces/facility";

const VALID_STATUSES: readonly FacilityStatus[] = ["active", "inactive", "maintenance"];

function toFacilityStatus(value: string): FacilityStatus {
  const match = VALID_STATUSES.find((status) => status === value);
  if (!match) {
    throw new Error(`Unknown facility status received from data source: "${value}"`);
  }
  return match;
}

export function toFacility(dto: FacilityDto): Facility {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    status: toFacilityStatus(dto.status),
    updatedAt: dto.updated,
    latitude: dto.lat,
    longitude: dto.lng,
    region: dto.region,
    manager: dto.manager,
    capacity: dto.capacity,
    description: dto.description
  };
}

export function toFacilityDto(facility: Facility): FacilityDto {
  return {
    id: facility.id,
    name: facility.name,
    type: facility.type,
    status: facility.status,
    updated: facility.updatedAt,
    lat: facility.latitude,
    lng: facility.longitude,
    region: facility.region,
    manager: facility.manager,
    capacity: facility.capacity,
    description: facility.description
  };
}
