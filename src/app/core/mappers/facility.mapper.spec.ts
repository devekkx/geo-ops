import type { FacilityDto } from "@core/dtos/facility.dto";
import { toFacility, toFacilityDto } from "./facility.mapper";
import type { Facility } from "@core/interfaces/facility.interface";

describe("facility mapper", () => {
  const dto: FacilityDto = {
    id: "FC-0001",
    name: "Accra Central Data Center",
    type: "Data Center",
    status: "active",
    updated: "2025-06-12",
    lat: 5.6037,
    lng: -0.187,
    region: "Greater Accra, Ghana",
    manager: "Kwame Mensah",
    capacity: "48 racks",
    description: "A data center."
  };

  const facility: Facility = {
    id: "FC-0001",
    name: "Accra Central Data Center",
    type: "Data Center",
    status: "active",
    updatedAt: "2025-06-12",
    latitude: 5.6037,
    longitude: -0.187,
    region: "Greater Accra, Ghana",
    manager: "Kwame Mensah",
    capacity: "48 racks",
    description: "A data center."
  };

  it("maps a DTO to a domain facility", () => {
    expect(toFacility(dto)).toEqual(facility);
  });

  it("maps a domain facility back to a DTO", () => {
    expect(toFacilityDto(facility)).toEqual(dto);
  });

  it("throws for an unknown status value", () => {
    expect(() => toFacility({ ...dto, status: "Retired" })).toThrow(/Unknown facility status/);
  });
});
