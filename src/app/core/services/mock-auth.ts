import { computed, Injectable, signal } from "@angular/core";
import { delay, map, type Observable, of, throwError } from "rxjs";

import { DEMO_PASSWORD, DEMO_USER, LOGIN_LATENCY_MS, SESSION_KEY } from "@core/constants/auth";
import type { AuthUser } from "@core/interfaces/auth";
import type { AuthPort } from "../tokens/auth";

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

@Injectable()
export class MockAuthService implements AuthPort {
  readonly currentUser = signal<AuthUser | null>(readStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(email: string, password: string): Observable<AuthUser> {
    if (email.trim().toLowerCase() !== DEMO_USER.email || password !== DEMO_PASSWORD) {
      return throwError(() => new Error("Invalid email or password.")).pipe(
        delay(LOGIN_LATENCY_MS)
      );
    }
    return of(DEMO_USER).pipe(
      delay(LOGIN_LATENCY_MS),
      map((user) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        return user;
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
  }
}
