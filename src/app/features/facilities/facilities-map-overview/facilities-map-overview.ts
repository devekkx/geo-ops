import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import { FACILITY_REPOSITORY } from "@core/facilities/facility-repository";
import type { Facility } from "@core/models/facility.model";
import { StatusBadge } from "@shared/status-badge/status-badge";
import { FacilityMap } from "@features/facilities/facility-map/facility-map";

type OverviewState = "loading" | "loaded" | "error";

const ERROR_MESSAGE =
  "Something went wrong while retrieving the data. Please check your connection and try again.";

@Component({
  selector: "geo-facilities-map-overview",
  imports: [RouterLink, StatusBadge, FacilityMap],
  templateUrl: "./facilities-map-overview.html",
  styleUrl: "./facilities-map-overview.css"
})
export class FacilitiesMapOverview {
  private readonly repository = inject(FACILITY_REPOSITORY);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<OverviewState>("loading");
  protected readonly facilities = signal<Facility[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly errorMessage = signal("");

  protected readonly count = computed(() => this.facilities().length);

  constructor() {
    this.loadFacilities();
  }

  protected onSelect(id: string): void {
    this.selectedId.set(id);
  }

  protected onRetry(): void {
    this.loadFacilities();
  }

  private loadFacilities(): void {
    this.state.set("loading");
    this.repository
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (facilities) => {
          this.facilities.set(facilities);
          this.state.set("loaded");
        },
        error: () => {
          this.state.set("error");
          this.errorMessage.set(ERROR_MESSAGE);
        }
      });
  }
}
