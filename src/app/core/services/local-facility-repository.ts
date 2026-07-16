import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, type Observable, delay, map, of, shareReplay, tap } from "rxjs";

import type { FacilityDto } from "@core/dtos/facility";
import type { Facility, FacilityDraft } from "@core/interfaces/facility";
import { toFacility } from "@core/mappers/facility";
import { Clock } from "@core/services/clock";
import { LocalStorageService } from "@core/services/local-storage";
import type { FacilityRepository } from "../tokens/facility-repository";

const DATA_URL = "data/facilities.json";
const STORAGE_KEY = "geo-ops.facilities";
const READ_LATENCY_MS = 500;
const WRITE_LATENCY_MS = 700;

@Injectable()
export class LocalFacilityRepository implements FacilityRepository {
  private readonly _http = inject(HttpClient);
  private readonly _clock = inject(Clock);
  private readonly _storage = inject(LocalStorageService);
  private readonly _store = new BehaviorSubject<Facility[] | null>(null);
  private _load$?: Observable<Facility[]>;

  /** Retrieves every facility, loading and caching them on first call. */
  public getAll(): Observable<Facility[]> {
    return this._ensureLoaded().pipe(delay(READ_LATENCY_MS));
  }

  /** Retrieves a single facility by its `id`, or `undefined` if none matches. */
  public getById(id: string): Observable<Facility | undefined> {
    return this._ensureLoaded().pipe(
      delay(READ_LATENCY_MS),
      map((facilities) => facilities.find((facility) => facility.id === id))
    );
  }

  /** Creates a new facility from `draft`, assigning it an id and persisting the change. */
  public create(draft: FacilityDraft): Observable<Facility> {
    return this._ensureLoaded().pipe(
      delay(WRITE_LATENCY_MS),
      map((facilities) => {
        const facility: Facility = {
          ...draft,
          id: this._nextId(facilities),
          updatedAt: this._clock.now().toISOString().slice(0, 10)
        };
        this._persist([facility, ...facilities]);
        return facility;
      })
    );
  }

  /**
   * Updates the facility with the given `id` from `draft` and persists the change.
   *
   * @throws Error via the returned observable if no facility with `id` exists.
   */
  public update(id: string, draft: FacilityDraft): Observable<Facility> {
    return this._ensureLoaded().pipe(
      delay(WRITE_LATENCY_MS),
      map((facilities) => {
        const exists = facilities.some((facility) => facility.id === id);
        if (!exists) {
          throw new Error(`Facility "${id}" was not found.`);
        }
        const updated: Facility = {
          ...draft,
          id,
          updatedAt: this._clock.now().toISOString().slice(0, 10)
        };
        this._persist(facilities.map((facility) => (facility.id === id ? updated : facility)));
        return updated;
      })
    );
  }

  private _ensureLoaded(): Observable<Facility[]> {
    const current = this._store.value;
    if (current) {
      return of(current);
    }
    const cached = this._storage.getItem<Facility[]>(STORAGE_KEY);
    if (cached) {
      this._store.next(cached);
      return of(cached);
    }
    this._load$ ??= this._http.get<FacilityDto[]>(DATA_URL).pipe(
      map((dtos) => dtos.map(toFacility)),
      tap((facilities) => this._persist(facilities)),
      shareReplay(1)
    );
    return this._load$;
  }

  private _persist(facilities: Facility[]): void {
    this._store.next(facilities);
    this._storage.setItem(STORAGE_KEY, facilities);
  }

  private _nextId(facilities: Facility[]): string {
    const maxSequence = facilities.reduce((max, facility) => {
      const sequence = Number.parseInt(facility.id.replace(/\D/g, ""), 10);
      return Number.isNaN(sequence) ? max : Math.max(max, sequence);
    }, 0);
    return `FC-${String(maxSequence + 1).padStart(4, "0")}`;
  }
}
