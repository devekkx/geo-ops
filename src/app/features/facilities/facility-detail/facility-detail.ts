import { DatePipe, Location } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";

import type { Facility } from "@core/interfaces/facility";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository";
import { FacilityMap } from "@features/facilities/facility-map/facility-map";
import { StatusBadge } from "@shared/components/status-badge/status-badge";

type DetailState = "loading" | "loaded" | "error";

@Component({
  selector: "geo-facility-detail",
  imports: [MatButtonModule, MatIconModule, StatusBadge, FacilityMap, DatePipe],
  templateUrl: "./facility-detail.html"
})
export class FacilityDetail {
  private readonly _repository = inject(FACILITY_REPOSITORY);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _location = inject(Location);

  protected readonly state = signal<DetailState>("loading");
  protected readonly facility = signal<Facility | null>(null);
  protected readonly errorMessage = signal("");

  protected readonly mapFacilities = computed(() => {
    const facility = this.facility();
    return facility ? [facility] : [];
  });

  protected readonly facilityDetails = computed(() => {
    return [
      {
        label: "Type",
        value: this.facility()?.type ?? ""
      },
      {
        label: "Status",
        value: this.facility()?.status ?? ""
      },
      {
        label: "Region",
        value: this.facility()?.region ?? ""
      },
      {
        label: "Manager",
        value: this.facility()?.manager ?? ""
      },
      {
        label: "Capacity",
        value: this.facility()?.capacity ?? ""
      },
      {
        label: "Latitude",
        value: this.facility()?.latitude ?? ""
      },
      {
        label: "Longitude",
        value: this.facility()?.longitude ?? ""
      },
      {
        label: "Last Updated",
        value: this.facility()?.updatedAt ?? "",
        isDate: true
      }
    ];
  });

  constructor() {
    this._loadFacility();
  }

  protected onBack(): void {
    this._location.back();
  }

  protected onEdit(): void {
    const id = this.facility()?.id;
    if (id) {
      void this._router.navigate(["/facilities", id, "edit"]);
    }
  }

  private _loadFacility(): void {
    const id = this._route.snapshot.paramMap.get("id");
    if (!id) {
      this.state.set("error");
      this.errorMessage.set("No facility was specified.");
      return;
    }

    this.state.set("loading");
    this._repository
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
