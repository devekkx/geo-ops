import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import type { MockInstance } from "vitest";

import type { Facility } from "@core/interfaces/facility";
import type { FacilityRepository } from "@core/tokens/facility-repository";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository";
import { FacilityList } from "./facility-list";

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

const FACILITY_C: Facility = {
  id: "FC-0003",
  name: "Tema Network Tower",
  type: "Network Tower",
  status: "inactive",
  updatedAt: "2025-04-01",
  latitude: 5.6698,
  longitude: -0.0166
};

const ALL_FACILITIES = [FACILITY_A, FACILITY_B, FACILITY_C];

function createRoute(queryParams: Record<string, string> = {}): ActivatedRoute {
  const map = new Map(Object.entries(queryParams));
  const queryParamMap = {
    get: (key: string) => map.get(key) ?? null,
    has: (key: string) => map.has(key)
  };
  return { snapshot: { queryParamMap } } as unknown as ActivatedRoute;
}

function createRepository(overrides: Partial<FacilityRepository> = {}): FacilityRepository {
  return {
    getAll: vi.fn().mockReturnValue(of(ALL_FACILITIES)),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    ...overrides
  };
}

function setup(
  options: { repository?: FacilityRepository; queryParams?: Record<string, string> } = {}
): {
  fixture: ReturnType<typeof TestBed.createComponent<FacilityList>>;
  repository: FacilityRepository;
  navigateSpy: MockInstance<Router["navigate"]>;
} {
  const repository = options.repository ?? createRepository();
  const route = createRoute(options.queryParams);

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: FACILITY_REPOSITORY, useValue: repository },
      { provide: ActivatedRoute, useValue: route }
    ]
  });

  const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
  const fixture = TestBed.createComponent(FacilityList);
  fixture.detectChanges();
  return { fixture, repository, navigateSpy };
}

type Fixture = ReturnType<typeof setup>["fixture"];

function bodyText(fixture: Fixture): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? "";
}

function rowTexts(fixture: Fixture): string[] {
  return fixture.debugElement
    .queryAll(By.css(".mat-mdc-row"))
    .map((row) => (row.nativeElement as HTMLElement).textContent ?? "");
}

function inputElement(fixture: Fixture): HTMLInputElement {
  return fixture.debugElement.query(By.css("input")).nativeElement as HTMLInputElement;
}

function findButtonByText(fixture: Fixture, text: string): HTMLButtonElement {
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

afterEach(() => {
  vi.useRealTimers();
});

describe("FacilityList", () => {
  it("renders every facility once loaded", () => {
    const { fixture } = setup();

    const rows = rowTexts(fixture);
    expect(rows).toHaveLength(3);
    expect(bodyText(fixture)).toContain("1-3 of 3 facilities");
  });

  it("filters by search term after the debounce", () => {
    vi.useFakeTimers();
    const { fixture } = setup();

    const input = inputElement(fixture);
    input.value = "kumasi";
    input.dispatchEvent(new Event("input"));
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const rows = rowTexts(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain(FACILITY_B.name);
  });

  it("filters by status", () => {
    const { fixture } = setup();

    fixture.debugElement
      .query(By.css("mat-select"))
      .triggerEventHandler("selectionChange", { value: "maintenance" });
    fixture.detectChanges();

    const rows = rowTexts(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain(FACILITY_B.name);
  });

  it("shows the empty state when there are no facilities at all", () => {
    const repository = createRepository({ getAll: vi.fn().mockReturnValue(of([])) });
    const { fixture } = setup({ repository });

    expect(bodyText(fixture)).toContain("No facilities found");
    expect(bodyText(fixture)).toContain("There are no facilities registered yet.");
  });

  it("shows a filtered-empty state with a Clear filters action", () => {
    vi.useFakeTimers();
    const { fixture } = setup();

    fixture.debugElement
      .query(By.css("mat-select"))
      .triggerEventHandler("selectionChange", { value: "maintenance" });
    fixture.detectChanges();

    const input = inputElement(fixture);
    input.value = "accra";
    input.dispatchEvent(new Event("input"));
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(bodyText(fixture)).toContain("No facilities match your search or filter.");

    findButtonByText(fixture, "Clear filters").click();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(rowTexts(fixture)).toHaveLength(3);
    expect(input.value).toBe("");
  });

  it("shows an error message and reloads on retry", () => {
    const getAll = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error("network down")))
      .mockReturnValueOnce(of(ALL_FACILITIES));
    const { fixture } = setup({ repository: createRepository({ getAll }) });

    expect(bodyText(fixture)).toContain("Something went wrong while retrieving the data.");

    findButtonByText(fixture, "Retry").click();
    fixture.detectChanges();

    expect(rowTexts(fixture)).toHaveLength(3);
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it("simulates a delayed error via the simulateError query param", () => {
    vi.useFakeTimers();
    const { fixture } = setup({ queryParams: { simulateError: "1" } });

    expect(bodyText(fixture)).not.toContain("Something went wrong");

    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(bodyText(fixture)).toContain("Something went wrong while retrieving the data.");
  });

  it("restores search, status, and page size from the query params", () => {
    const { fixture } = setup({
      queryParams: { search: "kumasi", status: "maintenance", pageSize: "5" }
    });

    expect(inputElement(fixture).value).toBe("kumasi");

    const rows = rowTexts(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain(FACILITY_B.name);
  });

  it("changes the page and page size via the paginator", () => {
    const { fixture } = setup();

    fixture.debugElement
      .query(By.css("mat-paginator"))
      .triggerEventHandler("page", { pageIndex: 0, pageSize: 1, length: 3 });
    fixture.detectChanges();

    expect(rowTexts(fixture)).toHaveLength(1);
    expect(bodyText(fixture)).toContain("1-1 of 3 facilities");
  });

  it("moves to a later page and reflects it in the range label", () => {
    const { fixture } = setup();

    fixture.debugElement
      .query(By.css("mat-paginator"))
      .triggerEventHandler("page", { pageIndex: 1, pageSize: 1, length: 3 });
    fixture.detectChanges();

    expect(rowTexts(fixture)).toHaveLength(1);
    expect(bodyText(fixture)).toContain("2-2 of 3 facilities");
  });

  it("syncs filter changes back to the URL via router.navigate", () => {
    const { fixture, navigateSpy } = setup();

    fixture.debugElement
      .query(By.css("mat-select"))
      .triggerEventHandler("selectionChange", { value: "maintenance" });
    fixture.detectChanges();

    /* eslint-disable @typescript-eslint/no-unsafe-assignment -- Vitest's expect.objectContaining() is typed `any` */
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ status: "maintenance", page: null })
      })
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  });
});
