import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AUTH_PORT } from './core/auth/auth-port';
import { MockAuthService } from './core/auth/mock-auth.service';
import { FACILITY_REPOSITORY } from './core/facilities/facility-repository';
import { LocalFacilityRepository } from './core/facilities/local-facility-repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: FACILITY_REPOSITORY, useClass: LocalFacilityRepository },
    { provide: AUTH_PORT, useClass: MockAuthService },
  ],
};
