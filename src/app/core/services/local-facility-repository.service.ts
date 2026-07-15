import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, type Observable, delay, map, of, shareReplay, tap } from "rxjs";

import type { FacilityDto } from "@core/dtos/facility.dto";
import { toFacility } from "@core/mappers/facility.mapper";
import type { Facility, FacilityDraft } from "@core/interfaces/facility.interface";
import { Clock } from "@core/services/clock.service";
import type { FacilityRepository } from "../tokens/facility-repository.token";

const DATA_URL = "data/facilities.json";
const READ_LATENCY_MS = 500;
const WRITE_LATENCY_MS = 700;

@Injectable()
export class LocalFacilityRepository implements FacilityRepository {
  private readonly http = inject(HttpClient);
  private readonly clock = inject(Clock);
  private readonly store = new BehaviorSubject<Facility[] | null>(null);
  private load$?: Observable<Facility[]>;

  getAll(): Observable<Facility[]> {
    return this.ensureLoaded().pipe(delay(READ_LATENCY_MS));
  }

  getById(id: string): Observable<Facility | undefined> {
    return this.ensureLoaded().pipe(
      delay(READ_LATENCY_MS),
      map((facilities) => facilities.find((facility) => facility.id === id))
    );
  }

  create(draft: FacilityDraft): Observable<Facility> {
    return this.ensureLoaded().pipe(
      delay(WRITE_LATENCY_MS),
      map((facilities) => {
        const facility: Facility = {
          ...draft,
          id: this.nextId(facilities),
          updatedAt: this.clock.now().toISOString().slice(0, 10)
        };
        this.store.next([facility, ...facilities]);
        return facility;
      })
    );
  }

  update(id: string, draft: FacilityDraft): Observable<Facility> {
    return this.ensureLoaded().pipe(
      delay(WRITE_LATENCY_MS),
      map((facilities) => {
        const exists = facilities.some((facility) => facility.id === id);
        if (!exists) {
          throw new Error(`Facility "${id}" was not found.`);
        }
        const updated: Facility = {
          ...draft,
          id,
          updatedAt: this.clock.now().toISOString().slice(0, 10)
        };
        this.store.next(facilities.map((facility) => (facility.id === id ? updated : facility)));
        return updated;
      })
    );
  }

  private ensureLoaded(): Observable<Facility[]> {
    const current = this.store.value;
    if (current) {
      return of(current);
    }
    this.load$ ??= this.http.get<FacilityDto[]>(DATA_URL).pipe(
      map((dtos) => dtos.map(toFacility)),
      tap((facilities) => this.store.next(facilities)),
      shareReplay(1)
    );
    return this.load$;
  }

  private nextId(facilities: Facility[]): string {
    const maxSequence = facilities.reduce((max, facility) => {
      const sequence = Number.parseInt(facility.id.replace(/\D/g, ""), 10);
      return Number.isNaN(sequence) ? max : Math.max(max, sequence);
    }, 0);
    return `FC-${String(maxSequence + 1).padStart(4, "0")}`;
  }
}
