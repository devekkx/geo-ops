import { TestBed, type ComponentFixture } from "@angular/core/testing";

import type { Facility } from "@core/interfaces/facility";
import { FacilityMap } from "./facility-map";

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

describe("FacilityMap", () => {
  function createFixture(): ComponentFixture<FacilityMap> {
    TestBed.configureTestingModule({ imports: [FacilityMap] });
    return TestBed.createComponent(FacilityMap);
  }

  it("describes a single facility in its aria-label", () => {
    const fixture = createFixture();
    fixture.componentRef.setInput("facilities", [FACILITY_A]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("[aria-label]")?.getAttribute("aria-label")).toBe(
      `Map showing the location of ${FACILITY_A.name}`
    );
  });

  it("describes multiple facilities in its aria-label", () => {
    const fixture = createFixture();
    fixture.componentRef.setInput("facilities", [FACILITY_A, FACILITY_B]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("[aria-label]")?.getAttribute("aria-label")).toBe(
      "Map showing the location of 2 facilities"
    );
  });

  it("describes zero facilities in its aria-label", () => {
    const fixture = createFixture();
    fixture.componentRef.setInput("facilities", []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("[aria-label]")?.getAttribute("aria-label")).toBe(
      "Map showing the location of 0 facilities"
    );
  });

  it("accepts a selectedId input without throwing", () => {
    const fixture = createFixture();
    fixture.componentRef.setInput("facilities", [FACILITY_A, FACILITY_B]);
    fixture.componentRef.setInput("selectedId", FACILITY_B.id);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it("destroys cleanly when the map was never initialized", () => {
    const fixture = createFixture();
    fixture.componentRef.setInput("facilities", [FACILITY_A]);
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
