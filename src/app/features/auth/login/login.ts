import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { AUTH_PORT } from '../../../core/auth/auth-port';

const DEMO_EMAIL = 'ama.owusu@amalitech.com';
const DEMO_PASSWORD = 'demo1234';

@Component({
  selector: 'geo-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AUTH_PORT);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl(DEMO_EMAIL, {
      nonNullable: true,
      validators: [
        (control) => Validators.required(control),
        (control) => Validators.email(control),
      ],
    }),
    password: new FormControl(DEMO_PASSWORD, {
      nonNullable: true,
      validators: [(control) => Validators.required(control)],
    }),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected onSubmit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/facilities']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Unable to sign in.');
      },
    });
  }
}
