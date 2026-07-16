import { provideHttpClient } from "@angular/common/http";
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from "@angular/router";

import { provideIconRegistry } from "@core/services/icon-registry.provider";
import { LocalFacilityRepository } from "@core/services/local-facility-repository";
import { MockAuthService } from "@core/services/mock-auth";
import { AUTH_PORT } from "@core/tokens/auth.token";
import { FACILITY_REPOSITORY } from "@core/tokens/facility-repository.token";
import { routes } from "./app.routes";

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
