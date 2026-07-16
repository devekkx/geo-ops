import { provideHttpClient } from "@angular/common/http";
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { AUTH_PORT } from "./core/tokens/auth.token";
import { MockAuthService } from "./core/services/mock-auth.service";
import { FACILITY_REPOSITORY } from "./core/tokens/facility-repository.token";
import { LocalFacilityRepository } from "./core/services/local-facility-repository.service";
import { provideIconRegistry } from "./core/services/icon-registry.provider";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideIconRegistry(),
    { provide: FACILITY_REPOSITORY, useClass: LocalFacilityRepository },
    { provide: AUTH_PORT, useClass: MockAuthService }
  ]
};
