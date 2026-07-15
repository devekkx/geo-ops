import { InjectionToken, type Signal } from '@angular/core';
import type { Observable } from 'rxjs';

import type { AuthUser } from '../models/auth.model';

export interface AuthPort {
  readonly currentUser: Signal<AuthUser | null>;
  readonly isAuthenticated: Signal<boolean>;
  login(email: string, password: string): Observable<AuthUser>;
  logout(): void;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
