import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";

import { FACILITY_STATUSES, FACILITY_TYPES } from "@core/constants/facility";
import type { FacilityDraft, FacilityStatus } from "@core/interfaces/facility";
import { NotificationService } from "@core/services/notification";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository";
import { rangeValidator } from "@core/validators/range";
import {
  FacilityLocationPicker,
  type FacilityCoordinates
} from "@features/facilities/facility-location-picker/facility-location-picker";
import { SentenceCasePipe } from "@shared/pipes/sentence-case.pipe";

type FormState = "loading" | "ready" | "error";

@Component({
  selector: "geo-facility-form",
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SentenceCasePipe,
    FacilityLocationPicker
  ],
  templateUrl: "./facility-form.html",
  styleUrl: "./facility-form.css"
})
export class FacilityForm {
  private readonly repository = inject(FACILITY_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly facilityId = this.route.snapshot.paramMap.get("id");

  protected readonly isEditMode = this.facilityId !== null;
  protected readonly facilityTypes = FACILITY_TYPES;
  protected readonly facilityStatuses = FACILITY_STATUSES;

  protected readonly state = signal<FormState>(this.isEditMode ? "loading" : "ready");
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal("");

  protected readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [(control) => Validators.required(control)]
    }),
    type: new FormControl("", {
      nonNullable: true,
      validators: [(control) => Validators.required(control)]
    }),
    status: new FormControl<FacilityStatus | "">("", {
      nonNullable: true,
      validators: [(control) => Validators.required(control)]
    }),
    latitude: new FormControl<number | null>(null, {
      validators: [(control) => Validators.required(control), rangeValidator(-90, 90)]
    }),
    longitude: new FormControl<number | null>(null, {
      validators: [(control) => Validators.required(control), rangeValidator(-180, 180)]
    }),
    manager: new FormControl("", { nonNullable: true }),
    capacity: new FormControl("", { nonNullable: true }),
    description: new FormControl("", { nonNullable: true })
  });

  protected readonly latitude = toSignal(this.form.controls.latitude.valueChanges, {
    initialValue: this.form.controls.latitude.value
  });
  protected readonly longitude = toSignal(this.form.controls.longitude.valueChanges, {
    initialValue: this.form.controls.longitude.value
  });

  protected readonly title = computed(() => (this.isEditMode ? "Edit facility" : "New facility"));
  protected readonly subtitle = computed(() =>
    this.isEditMode ? "Update this facility’s details" : "Register a facility in the network"
  );

  constructor() {
    if (this.isEditMode && this.facilityId) {
      this.loadFacility(this.facilityId);
    }
  }

  protected onCoordinatesChange(coordinates: FacilityCoordinates): void {
    this.form.patchValue({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });
    this.form.controls.latitude.markAsTouched();
    this.form.controls.longitude.markAsTouched();
  }

  protected onCancel(): void {
    const target =
      this.isEditMode && this.facilityId ? ["/facilities", this.facilityId] : ["/facilities"];
    void this.router.navigate(target);
  }

  protected onSave(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const draft: FacilityDraft = {
      name: raw.name.trim(),
      type: raw.type,
      status: raw.status as FacilityStatus,
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      manager: raw.manager.trim() || undefined,
      capacity: raw.capacity.trim() || undefined,
      description: raw.description.trim() || undefined
    };

    const save$ =
      this.isEditMode && this.facilityId
        ? this.repository.update(this.facilityId, draft)
        : this.repository.create(draft);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (facility) => {
        this.saving.set(false);
        this.notifications.success(
          this.isEditMode ? `${facility.name} was updated.` : `${facility.name} was created.`
        );
        void this.router.navigate(["/facilities", facility.id]);
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error("Unable to save this facility. Please try again.");
      }
    });
  }

  private loadFacility(id: string): void {
    this.repository
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (facility) => {
          if (!facility) {
            this.state.set("error");
            this.errorMessage.set(`We couldn't find a facility with id "${id}".`);
            return;
          }
          this.form.patchValue(facility);
          this.state.set("ready");
        },
        error: () => {
          this.state.set("error");
          this.errorMessage.set("Something went wrong while retrieving this facility.");
        }
      });
  }
}
