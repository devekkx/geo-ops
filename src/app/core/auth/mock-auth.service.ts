import { Injectable, computed, signal } from '@angular/core';
import { type Observable, delay, map, of, throwError } from 'rxjs';

import type { AuthUser } from '../models/auth.model';
import type { AuthPort } from './auth-port';

const SESSION_KEY = 'geo-ops.auth-user';
const LOGIN_LATENCY_MS = 600;

const DEMO_USER: AuthUser = {
  uid: 'demo-ama-owusu',
  email: 'ama.owusu@amalitech.com',
  displayName: 'Ama Owusu',
};
const DEMO_PASSWORD = 'demo1234';

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
      return throwError(() => new Error('Invalid email or password.')).pipe(
        delay(LOGIN_LATENCY_MS),
      );
    }
    return of(DEMO_USER).pipe(
      delay(LOGIN_LATENCY_MS),
      map((user) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        return user;
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
  }
}

export const DEMO_CREDENTIALS = { email: DEMO_USER.email, password: DEMO_PASSWORD };
