import { Component, computed, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { RouterLink } from "@angular/router";
import type { Facility } from "@core/interfaces/facility";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { FacilityMap } from "@features/facilities/facility-map/facility-map";
import { StatusBadge } from "@shared/components/status-badge/status-badge";
import { GENERIC_LOAD_ERROR_MESSAGE } from "@shared/constants/messages";

type OverviewState = "loading" | "loaded" | "error";

@Component({
  selector: "geo-facilities-map-overview",
  imports: [StatusBadge, FacilityMap, RouterLink],
  templateUrl: "./facilities-map-overview.html",
  styleUrl: "./facilities-map-overview.css"
})
export class FacilitiesMapOverview {
  protected readonly state = signal<OverviewState>("loading");
  protected readonly facilities = signal<Facility[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly errorMessage = signal("");
  protected readonly count = computed(() => this.facilities().length);
  private readonly repository = inject(FACILITY_REPOSITORY);
  private readonly destroyRef = inject(DestroyRef);

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
          this.errorMessage.set(GENERIC_LOAD_ERROR_MESSAGE);
        }
      });
  }
}
