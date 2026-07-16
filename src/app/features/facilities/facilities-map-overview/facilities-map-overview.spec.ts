import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { Subject, of, throwError } from "rxjs";

import type { Facility } from "@core/interfaces/facility.interface";
import type { FacilityRepository } from "@core/tokens/facility-repository.token";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { FacilityMap } from "@features/facilities/facility-map/facility-map";
import { FacilitiesMapOverview } from "./facilities-map-overview";

const FACILITY_A: Facility = {
  id: "FC-0001",
  name: "Accra Central Data Center",
  type: "Data Center",
  status: "active",
  updatedAt: "2025-06-12",
  latitude: 5.6037,
  longitude: -0.187
};

const FACILITY_B: Facility = {
  id: "FC-0002",
  name: "Kumasi Solar Plant",
  type: "Solar Plant",
  status: "maintenance",
  updatedAt: "2025-05-28",
  latitude: 6.6885,
  longitude: -1.6244
};

function createRepository(overrides: Partial<FacilityRepository> = {}): FacilityRepository {
  return {
    getAll: vi.fn().mockReturnValue(of([FACILITY_A, FACILITY_B])),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    ...overrides
  };
}

function setup(repository: FacilityRepository = createRepository()) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: FACILITY_REPOSITORY, useValue: repository }]
  });

  const fixture = TestBed.createComponent(FacilitiesMapOverview);
  fixture.detectChanges();
  return fixture;
}

function bodyText(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? "";
}

function facilityMap(fixture: ReturnType<typeof setup>): FacilityMap {
  return fixture.debugElement.query(By.directive(FacilityMap)).componentInstance as FacilityMap;
}

describe("FacilitiesMapOverview", () => {
  it("shows a loading message before the facilities arrive", () => {
    const pending = new Subject<Facility[]>();
    const fixture = setup(createRepository({ getAll: vi.fn().mockReturnValue(pending) }));

    expect(bodyText(fixture)).toContain("Loading facilities");
  });

  it("renders every facility once loaded", () => {
    const fixture = setup();

    const rows = fixture.debugElement.queryAll(By.css("[aria-pressed]"));
    expect(rows.length).toBe(2);
    expect(bodyText(fixture)).toContain(FACILITY_A.name);
    expect(bodyText(fixture)).toContain(FACILITY_B.name);
  });

  it("selects a facility when its row is clicked", () => {
    const fixture = setup();

    const rows = fixture.debugElement.queryAll(By.css("[aria-pressed]"));
    (rows[1].nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(facilityMap(fixture).selectedId()).toBe(FACILITY_B.id);
    expect((rows[1].nativeElement as HTMLElement).getAttribute("aria-pressed")).toBe("true");
  });

  it("selects a facility when the map emits a marker click", () => {
    const fixture = setup();

    facilityMap(fixture).markerClick.emit(FACILITY_A.id);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css("[aria-pressed]"));
    expect((rows[0].nativeElement as HTMLElement).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows an error message and retries on demand", () => {
    const getAll = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error("network down")))
      .mockReturnValueOnce(of([FACILITY_A]));
    const fixture = setup(createRepository({ getAll }));

    expect(bodyText(fixture)).toContain("Couldn't load facilities");

    const retryButton = fixture.debugElement.query(By.css("button"))
      .nativeElement as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(bodyText(fixture)).toContain(FACILITY_A.name);
    expect(getAll).toHaveBeenCalledTimes(2);
  });
});
