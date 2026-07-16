import { Location } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";

import type { Facility } from "@core/interfaces/facility.interface";
import type { FacilityRepository } from "@core/tokens/facility-repository.token";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { FacilityDetail } from "./facility-detail";

const FACILITY: Facility = {
  id: "FC-0001",
  name: "Accra Central Data Center",
  type: "Data Center",
  status: "active",
  updatedAt: "2025-06-12",
  latitude: 5.6037,
  longitude: -0.187
};

function createRepository(overrides: Partial<FacilityRepository> = {}): FacilityRepository {
  return {
    getAll: vi.fn().mockReturnValue(of([])),
    getById: vi.fn().mockReturnValue(of(FACILITY)),
    create: vi.fn(),
    update: vi.fn(),
    ...overrides
  };
}

function setup(options: { id?: string | null; repository?: FacilityRepository } = {}) {
  const id = options.id === undefined ? FACILITY.id : options.id;
  const repository = options.repository ?? createRepository();

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: FACILITY_REPOSITORY, useValue: repository },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => id } } }
      }
    ]
  });

  const fixture = TestBed.createComponent(FacilityDetail);
  fixture.detectChanges();
  return fixture;
}

function findButtonByText(fixture: ReturnType<typeof setup>, text: string): HTMLButtonElement {
  const button = fixture.debugElement
    .queryAll(By.css("button"))
    .find((candidate) =>
      (candidate.nativeElement as HTMLButtonElement).textContent?.includes(text)
    );

  if (!button) {
    throw new Error(`No button found containing text "${text}"`);
  }
  return button.nativeElement as HTMLButtonElement;
}

describe("FacilityDetail", () => {
  it("errors when no id is present in the route", () => {
    const fixture = setup({ id: null });

    const message = fixture.debugElement.queryAll(By.css("p"))[1].nativeElement as HTMLElement;
    expect(message.textContent?.trim()).toBe("No facility was specified.");
  });

  it("loads and renders the facility on success", () => {
    const fixture = setup();

    const heading = fixture.debugElement.query(By.css("h2")).nativeElement as HTMLElement;
    expect(heading.textContent?.trim()).toBe(FACILITY.name);
  });

  it("errors when the facility is not found", () => {
    const repository = createRepository({ getById: vi.fn().mockReturnValue(of(undefined)) });
    const fixture = setup({ repository });

    const message = fixture.debugElement.queryAll(By.css("p"))[1].nativeElement as HTMLElement;
    expect(message.textContent?.trim()).toBe(
      `We couldn't find a facility with id "${FACILITY.id}".`
    );
  });

  it("errors when the repository request fails", () => {
    const repository = createRepository({
      getById: vi.fn().mockReturnValue(throwError(() => new Error("network down")))
    });
    const fixture = setup({ repository });

    const message = fixture.debugElement.queryAll(By.css("p"))[1].nativeElement as HTMLElement;
    expect(message.textContent?.trim()).toBe(
      "Something went wrong while retrieving this facility."
    );
  });

  it("navigates back via Location when Back to facilities is clicked", () => {
    const fixture = setup();
    const backSpy = vi.spyOn(TestBed.inject(Location), "back");

    findButtonByText(fixture, "Back to facilities").click();

    expect(backSpy).toHaveBeenCalled();
  });

  it("navigates to the edit route when Edit facility is clicked", () => {
    const fixture = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    findButtonByText(fixture, "Edit facility").click();

    expect(navigateSpy).toHaveBeenCalledWith(["/facilities", FACILITY.id, "edit"]);
  });

  it("does not navigate on edit when there is no loaded facility", () => {
    const fixture = setup({ id: null });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    (fixture.componentInstance as unknown as { onEdit: () => void }).onEdit();

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
