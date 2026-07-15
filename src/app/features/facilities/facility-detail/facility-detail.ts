import { Location } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";

import { FACILITY_REPOSITORY } from "@core/facilities/facility-repository";
import type { Facility } from "@core/models/facility.model";
import { StatusBadge } from "@shared/status-badge/status-badge";
import { FacilityMap } from "@features/facilities/facility-map/facility-map";

type DetailState = "loading" | "loaded" | "error";

@Component({
  selector: "geo-facility-detail",
  imports: [MatButtonModule, StatusBadge, FacilityMap],
  templateUrl: "./facility-detail.html",
  styleUrl: "./facility-detail.css"
})
export class FacilityDetail {
  private readonly repository = inject(FACILITY_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly state = signal<DetailState>("loading");
  protected readonly facility = signal<Facility | null>(null);
  protected readonly errorMessage = signal("");

  protected readonly mapFacilities = computed(() => {
    const facility = this.facility();
    return facility ? [facility] : [];
  });

  constructor() {
    this.loadFacility();
  }

  protected onBack(): void {
    this.location.back();
  }

  protected onEdit(): void {
    const id = this.facility()?.id;
    if (id) {
      void this.router.navigate(["/facilities", id, "edit"]);
    }
  }

  private loadFacility(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.state.set("error");
      this.errorMessage.set("No facility was specified.");
      return;
    }

    this.state.set("loading");
    this.repository
      .getById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (facility) => {
          if (!facility) {
            this.state.set("error");
            this.errorMessage.set(`We couldn't find a facility with id "${id}".`);
            return;
          }
          this.facility.set(facility);
          this.state.set("loaded");
        },
        error: () => {
          this.state.set("error");
          this.errorMessage.set("Something went wrong while retrieving this facility.");
        }
      });
  }
}
