import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { Subject, of, throwError } from "rxjs";
import type { MockInstance } from "vitest";

import type { Facility } from "@core/interfaces/facility.interface";
import { NotificationService } from "@core/services/notification.service";
import type { FacilityRepository } from "@core/tokens/facility-repository.token";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { FacilityLocationPicker } from "@features/facilities/facility-location-picker/facility-location-picker";
import { FacilityForm } from "./facility-form";

const FACILITY: Facility = {
  id: "FC-0001",
  name: "Accra Central Data Center",
  type: "Data Center",
  status: "active",
  updatedAt: "2025-06-12",
  latitude: 5.6037,
  longitude: -0.187,
  manager: "Kwame Mensah",
  capacity: "48 racks",
  description: "A data center."
};

function setup(options: { id?: string | null; repository?: Partial<FacilityRepository> }) {
  const id = options.id === undefined ? null : options.id;
  const getAll: FacilityRepository["getAll"] =
    options.repository?.getAll ?? vi.fn().mockReturnValue(of([]));
  const getById: FacilityRepository["getById"] =
    options.repository?.getById ?? vi.fn().mockReturnValue(of(FACILITY));
  const create: FacilityRepository["create"] =
    options.repository?.create ?? vi.fn().mockReturnValue(of(FACILITY));
  const update: FacilityRepository["update"] =
    options.repository?.update ?? vi.fn().mockReturnValue(of(FACILITY));
  const notifySuccess = vi.fn();
  const notifyError = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: FACILITY_REPOSITORY, useValue: { getAll, getById, create, update } },
      {
        provide: NotificationService,
        useValue: { success: notifySuccess, error: notifyError }
      },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } }
    ]
  });

  const navigateSpy: MockInstance<Router["navigate"]> = vi
    .spyOn(TestBed.inject(Router), "navigate")
    .mockResolvedValue(true);
  const fixture = TestBed.createComponent(FacilityForm);
  fixture.detectChanges();
  return { fixture, navigateSpy, getAll, getById, create, update, notifySuccess, notifyError };
}

type Fixture = ReturnType<typeof setup>["fixture"];

interface FormAccessor {
  form: {
    controls: {
      type: { setValue: (value: string) => void };
      status: { setValue: (value: string) => void };
    };
  };
}

function setTypeAndStatus(fixture: Fixture, type: string, status: string): void {
  const accessor = fixture.componentInstance as unknown as FormAccessor;
  accessor.form.controls.type.setValue(type);
  accessor.form.controls.status.setValue(status);
  fixture.detectChanges();
}

function setInputValue(fixture: Fixture, formControlName: string, value: string): void {
  const input = fixture.debugElement.query(By.css(`[formcontrolname="${formControlName}"]`))
    .nativeElement as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input"));
  fixture.detectChanges();
}

function setCoordinates(fixture: Fixture, latitude: number, longitude: number): void {
  const picker = fixture.debugElement.query(By.directive(FacilityLocationPicker))
    .componentInstance as FacilityLocationPicker;
  picker.coordinatesChange.emit({ latitude, longitude });
  fixture.detectChanges();
}

function fillValidForm(fixture: Fixture): void {
  setInputValue(fixture, "name", "New Facility");
  setTypeAndStatus(fixture, "Data Center", "active");
  setCoordinates(fixture, 5.6037, -0.187);
}

function submit(fixture: Fixture): void {
  fixture.debugElement.query(By.css("form")).triggerEventHandler("ngSubmit", null);
  fixture.detectChanges();
}

function bodyText(fixture: Fixture): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? "";
}

describe("FacilityForm", () => {
  it("starts ready in create mode with an empty form", () => {
    const { fixture } = setup({});

    expect(bodyText(fixture)).toContain("New facility");
    expect(bodyText(fixture)).not.toContain("Edit facility");
  });

  it("loads and patches the form in edit mode", () => {
    const { fixture, getById } = setup({ id: FACILITY.id });

    expect(getById).toHaveBeenCalledWith(FACILITY.id);
    expect(bodyText(fixture)).toContain("Edit facility");

    const nameInput = fixture.debugElement.query(By.css('[formcontrolname="name"]'))
      .nativeElement as HTMLInputElement;
    expect(nameInput.value).toBe(FACILITY.name);
  });

  it("shows an error when the facility to edit is not found", () => {
    const { fixture } = setup({
      id: FACILITY.id,
      repository: { getById: vi.fn().mockReturnValue(of(undefined)) }
    });

    expect(bodyText(fixture)).toContain(`We couldn't find a facility with id "${FACILITY.id}"`);
  });

  it("shows a generic error when loading the facility fails", () => {
    const { fixture } = setup({
      id: FACILITY.id,
      repository: { getById: vi.fn().mockReturnValue(throwError(() => new Error("network down"))) }
    });

    expect(bodyText(fixture)).toContain("Something went wrong while retrieving this facility.");
  });

  it("reflects coordinates chosen on the map into the latitude/longitude fields", () => {
    const { fixture } = setup({});

    setCoordinates(fixture, 6.6885, -1.6244);

    const latInput = fixture.debugElement.query(By.css('[formcontrolname="latitude"]'))
      .nativeElement as HTMLInputElement;
    const lngInput = fixture.debugElement.query(By.css('[formcontrolname="longitude"]'))
      .nativeElement as HTMLInputElement;
    expect(Number(latInput.value)).toBeCloseTo(6.6885);
    expect(Number(lngInput.value)).toBeCloseTo(-1.6244);
  });

  it("does not save an invalid form", () => {
    const { fixture, create } = setup({});

    submit(fixture);

    expect(create).not.toHaveBeenCalled();
    expect(fixture.debugElement.queryAll(By.css("mat-error")).length).toBeGreaterThan(0);
  });

  it("creates a facility and navigates to it on success", () => {
    const { fixture, create, notifySuccess, navigateSpy } = setup({});

    fillValidForm(fixture);
    submit(fixture);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Facility",
        type: "Data Center",
        status: "active",
        latitude: 5.6037,
        longitude: -0.187
      })
    );
    expect(notifySuccess).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(["/facilities", FACILITY.id]);
  });

  it("updates the facility in edit mode", () => {
    const { fixture, update } = setup({ id: FACILITY.id });

    fillValidForm(fixture);
    submit(fixture);

    expect(update).toHaveBeenCalledWith(FACILITY.id, expect.any(Object));
  });

  it("shows an error notification and re-enables the form when saving fails", () => {
    const { fixture, notifyError } = setup({
      repository: { create: vi.fn().mockReturnValue(throwError(() => new Error("network down"))) }
    });

    fillValidForm(fixture);
    submit(fixture);

    expect(notifyError).toHaveBeenCalled();
    const saveButton = fixture.debugElement.query(By.css('button[type="submit"]'))
      .nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
  });

  it("ignores a second submit while one is already in flight", () => {
    const pending = new Subject<Facility>();
    const { fixture, create } = setup({ repository: { create: vi.fn().mockReturnValue(pending) } });

    fillValidForm(fixture);
    submit(fixture);
    submit(fixture);

    expect(create).toHaveBeenCalledTimes(1);
  });

  it("navigates back to the list on cancel in create mode", () => {
    const { fixture, navigateSpy } = setup({});

    const cancelButton = fixture.debugElement.query(By.css('button[type="button"]'))
      .nativeElement as HTMLButtonElement;
    cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(["/facilities"]);
  });

  it("navigates back to the detail page on cancel in edit mode", () => {
    const { fixture, navigateSpy } = setup({ id: FACILITY.id });

    const cancelButton = fixture.debugElement.query(By.css('button[type="button"]'))
      .nativeElement as HTMLButtonElement;
    cancelButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(["/facilities", FACILITY.id]);
  });
});
