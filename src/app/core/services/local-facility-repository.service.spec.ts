import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";

import type { FacilityDto } from "@core/dtos/facility.dto";
import type { FacilityDraft } from "@core/interfaces/facility.interface";
import { Clock } from "@core/services/clock.service";
import { LocalFacilityRepository } from "./local-facility-repository.service";

const FIXED_DATE = new Date("2026-01-15T00:00:00.000Z");

const DTOS: FacilityDto[] = [
  {
    id: "FC-0001",
    name: "Accra Central Data Center",
    type: "Data Center",
    status: "active",
    updated: "2025-06-12",
    lat: 5.6037,
    lng: -0.187
  },
  {
    id: "FC-0002",
    name: "Kumasi Solar Plant",
    type: "Solar Plant",
    status: "maintenance",
    updated: "2025-05-28",
    lat: 6.6885,
    lng: -1.6244
  }
];

function flushFacilities(httpMock: HttpTestingController): void {
  httpMock.expectOne("data/facilities.json").flush(DTOS);
}

describe("LocalFacilityRepository", () => {
  let repository: LocalFacilityRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalFacilityRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Clock, useValue: { now: () => FIXED_DATE } }
      ]
    });
    repository = TestBed.inject(LocalFacilityRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("loads and maps facilities from the JSON asset", async () => {
    const resultPromise = firstValueFrom(repository.getAll());
    flushFacilities(httpMock);
    const result = await resultPromise;

    expect(result).toEqual([
      expect.objectContaining({ id: "FC-0001", latitude: 5.6037, longitude: -0.187 }),
      expect.objectContaining({ id: "FC-0002", status: "maintenance" })
    ]);
  });

  it("returns a single facility by id", async () => {
    const resultPromise = firstValueFrom(repository.getById("FC-0002"));
    flushFacilities(httpMock);
    const result = await resultPromise;

    expect(result).toEqual(expect.objectContaining({ id: "FC-0002", name: "Kumasi Solar Plant" }));
  });

  it("returns undefined for an unknown id", async () => {
    const resultPromise = firstValueFrom(repository.getById("FC-9999"));
    flushFacilities(httpMock);
    const result = await resultPromise;

    expect(result).toBeUndefined();
  });

  it("creates a facility with a generated id and the current date", async () => {
    const draft: FacilityDraft = {
      name: "New Facility",
      type: "Office",
      status: "active",
      latitude: 1,
      longitude: 1
    };

    const createdPromise = firstValueFrom(repository.create(draft));
    flushFacilities(httpMock);
    const created = await createdPromise;

    expect(created).toEqual(
      expect.objectContaining({ id: "FC-0003", name: "New Facility", updatedAt: "2026-01-15" })
    );
  });

  it("updates an existing facility in place", async () => {
    const draft: FacilityDraft = {
      name: "Accra Central Data Center (Renamed)",
      type: "Data Center",
      status: "inactive",
      latitude: 5.6037,
      longitude: -0.187
    };

    const updatedPromise = firstValueFrom(repository.update("FC-0001", draft));
    flushFacilities(httpMock);
    const updated = await updatedPromise;

    expect(updated).toEqual(
      expect.objectContaining({
        id: "FC-0001",
        name: "Accra Central Data Center (Renamed)",
        status: "inactive",
        updatedAt: "2026-01-15"
      })
    );
  });

  it("throws when updating a facility that does not exist", async () => {
    const resultPromise = firstValueFrom(
      repository.update("FC-9999", {
        name: "Ghost",
        type: "Office",
        status: "active",
        latitude: 0,
        longitude: 0
      })
    );
    flushFacilities(httpMock);

    await expect(resultPromise).rejects.toBeInstanceOf(Error);
  });
});
