import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";

import type { Facility, FacilityDraft } from "@core/models/facility.model";

export interface FacilityRepository {
  getAll(): Observable<Facility[]>;
  getById(id: string): Observable<Facility | undefined>;
  create(draft: FacilityDraft): Observable<Facility>;
  update(id: string, draft: FacilityDraft): Observable<Facility>;
}

export const FACILITY_REPOSITORY = new InjectionToken<FacilityRepository>("FACILITY_REPOSITORY");
