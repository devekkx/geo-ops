import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Router, provideRouter } from "@angular/router";

import type { AuthPort } from "@core/tokens/auth.token";
import { AUTH_PORT } from "@core/tokens/auth.token";
import { authGuard, guestGuard } from "./auth.guard";

const ROUTE = {} as unknown as ActivatedRouteSnapshot;
const STATE = {} as unknown as RouterStateSnapshot;

function configureAuth(isAuthenticated: boolean): void {
  const auth: AuthPort = {
    currentUser: signal(null),
    isAuthenticated: signal(isAuthenticated),
    login: vi.fn(),
    logout: vi.fn()
  };

  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_PORT, useValue: auth }, provideRouter([])]
  });
}

describe("authGuard", () => {
  it("allows activation when the user is authenticated", () => {
    configureAuth(true);

    const result = TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));

    expect(result).toBe(true);
  });

  it("redirects to /login when the user is not authenticated", () => {
    configureAuth(false);

    const result = TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(["/login"]));
  });
});

describe("guestGuard", () => {
  it("allows activation when the user is not authenticated", () => {
    configureAuth(false);

    const result = TestBed.runInInjectionContext(() => guestGuard(ROUTE, STATE));

    expect(result).toBe(true);
  });

  it("redirects to /facilities when the user is authenticated", () => {
    configureAuth(true);

    const result = TestBed.runInInjectionContext(() => guestGuard(ROUTE, STATE));

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(["/facilities"]));
  });
});
