import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AUTH_PORT } from "./auth-port";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PORT);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(["/login"]);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PORT);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(["/facilities"]) : true;
};
