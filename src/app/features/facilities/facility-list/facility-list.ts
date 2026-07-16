import { Component, computed, DestroyRef, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule, type PageEvent } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { debounceTime, timer } from "rxjs";

import { FACILITY_STATUSES } from "@core/constants/facility";
import type { Facility, FacilityStatus } from "@core/interfaces/facility";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { StatusBadge } from "@shared/components/status-badge/status-badge";
import { GENERIC_LOAD_ERROR_MESSAGE } from "@shared/constants/messages";
import { SentenceCasePipe } from "@shared/pipes/sentence-case.pipe";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from "./facility-list.constants";

type ListState = "loading" | "loaded" | "error";
type StatusFilter = FacilityStatus | "all";

@Component({
  selector: "geo-facility-list",
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    StatusBadge,
    SentenceCasePipe
  ],
  templateUrl: "./facility-list.html",
  styleUrl: "./facility-list.css"
})
export class FacilityList {
  protected readonly displayedColumns = ["name", "type", "status", "updatedAt", "actions"];
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly facilityStatuses = FACILITY_STATUSES;
  protected readonly skeletonRows = Array.from({ length: 6 });
  protected readonly pageSize = signal(this.readInitialPageSize());
  protected readonly search = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
    { initialValue: this.searchControl.value }
  );
  protected readonly state = signal<ListState>("loading");
  protected readonly facilities = signal<Facility[]>([]);
  protected readonly errorMessage = signal("");
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    return this.facilities().filter(
      (facility) =>
        (status === "all" || facility.status === status) &&
        (!term || facility.name.toLowerCase().includes(term))
    );
  });
  protected readonly total = computed(() => this.filtered().length);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );
  protected readonly clampedPageIndex = computed(() =>
    Math.min(this.pageIndex(), this.pageCount() - 1)
  );
  protected readonly paged = computed(() => {
    const start = this.clampedPageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  protected readonly rangeLabel = computed(() => {
    if (this.total() === 0) {
      return "0 facilities";
    }
    const start = this.clampedPageIndex() * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, this.total());
    return `${start}-${end} of ${this.total()} facilities`;
  });
  protected readonly isFiltered = computed(
    () => this.search().trim() !== "" || this.status() !== "all"
  );
  private readonly repository = inject(FACILITY_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly initialParams = this.route.snapshot.queryParamMap;
  protected readonly searchControl = new FormControl(this.initialParams.get("search") ?? "", {
    nonNullable: true
  });
  protected readonly status = signal<StatusFilter>(
    (this.initialParams.get("status") as StatusFilter | null) ?? "all"
  );
  protected readonly pageIndex = signal(
    Math.max(0, Number.parseInt(this.initialParams.get("page") ?? "1", 10) - 1 || 0)
  );

  constructor() {
    effect(() => {
      const queryParams: Record<string, string | null> = {
        search: this.search().trim() || null,
        status: this.status() === "all" ? null : this.status(),
        page: this.clampedPageIndex() > 0 ? String(this.clampedPageIndex() + 1) : null,
        pageSize: this.pageSize() !== PAGE_SIZE ? String(this.pageSize()) : null
      };
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: "merge",
        replaceUrl: true
      });
    });

    this.loadFacilities();
  }

  protected onStatusChange(status: StatusFilter): void {
    this.status.set(status);
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected onClearFilters(): void {
    this.searchControl.setValue("");
    this.status.set("all");
    this.pageIndex.set(0);
  }

  protected onRetry(): void {
    this.loadFacilities();
  }

  private readInitialPageSize(): number {
    const parsed = Number.parseInt(this.initialParams.get("pageSize") ?? "", 10);
    return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : PAGE_SIZE;
  }

  private loadFacilities(): void {
    this.state.set("loading");
    this.errorMessage.set("");

    if (this.route.snapshot.queryParamMap.has("simulateError")) {
      timer(500)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.state.set("error");
          this.errorMessage.set(GENERIC_LOAD_ERROR_MESSAGE);
        });
      return;
    }

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
