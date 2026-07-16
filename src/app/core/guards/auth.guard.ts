import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AUTH_PORT } from "../tokens/auth";

/** Allows navigation only when the user is signed in; otherwise redirects to `/login`. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PORT);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(["/login"]);
};

/** Allows navigation only when the user is signed out; otherwise redirects to `/facilities`. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AUTH_PORT);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(["/facilities"]) : true;
};
