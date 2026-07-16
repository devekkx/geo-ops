import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import type { MockInstance } from "vitest";

import type { AuthUser } from "@core/interfaces/auth.interface";
import { DEMO_CREDENTIALS } from "@core/services/mock-auth.service";
import type { AuthPort } from "@core/tokens/auth.token";
import { AUTH_PORT } from "@core/tokens/auth.token";
import { Login } from "./login";

const DEMO_USER: AuthUser = {
  uid: "demo-user",
  email: DEMO_CREDENTIALS.email,
  displayName: "Demo User"
};

function createAuth(overrides: Partial<AuthPort> = {}): AuthPort {
  return {
    currentUser: signal(null),
    isAuthenticated: signal(false),
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides
  };
}

function queryElement<T extends Element>(fixture: ComponentFixture<Login>, selector: string): T {
  return fixture.debugElement.query(By.css(selector)).nativeElement as T;
}

function setup(auth: AuthPort = createAuth()): {
  fixture: ComponentFixture<Login>;
  navigateSpy: MockInstance<Router["navigate"]>;
} {
  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_PORT, useValue: auth }, provideRouter([])]
  });

  const fixture = TestBed.createComponent(Login);
  const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
  fixture.detectChanges();
  return { fixture, navigateSpy };
}

function inputFor(fixture: ComponentFixture<Login>, name: "email" | "password"): HTMLInputElement {
  return queryElement<HTMLInputElement>(fixture, `input[formcontrolname="${name}"]`);
}

function setValue(
  fixture: ComponentFixture<Login>,
  name: "email" | "password",
  value: string
): void {
  const input = inputFor(fixture, name);
  input.value = value;
  input.dispatchEvent(new Event("input"));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<Login>): void {
  fixture.debugElement.query(By.css("form")).triggerEventHandler("ngSubmit", null);
  fixture.detectChanges();
}

describe("Login", () => {
  it("pre-fills the demo credentials", () => {
    const { fixture } = setup();

    expect(inputFor(fixture, "email").value).toBe(DEMO_CREDENTIALS.email);
    expect(inputFor(fixture, "password").value).toBe(DEMO_CREDENTIALS.password);
  });

  it("does not submit when email and password are cleared", () => {
    const login = vi.fn();
    const { fixture } = setup(createAuth({ login }));

    setValue(fixture, "email", "");
    setValue(fixture, "password", "");
    submit(fixture);

    expect(login).not.toHaveBeenCalled();
    const errors = fixture.debugElement.queryAll(By.css("mat-error"));
    expect(errors.length).toBeGreaterThan(0);
  });

  it("does not submit with an invalid email address", () => {
    const login = vi.fn();
    const { fixture } = setup(createAuth({ login }));

    setValue(fixture, "email", "not-an-email");
    setValue(fixture, "password", "some-password");
    submit(fixture);

    expect(login).not.toHaveBeenCalled();
  });

  it("submits once both fields hold a valid email and a password", () => {
    const login = vi.fn().mockReturnValue(of(DEMO_USER));
    const { fixture } = setup(createAuth({ login }));

    setValue(fixture, "email", "jane@example.com");
    setValue(fixture, "password", "secret");
    submit(fixture);

    expect(login).toHaveBeenCalledWith("jane@example.com", "secret");
  });

  it("logs in with the form values and navigates to /facilities on success", () => {
    const login = vi.fn().mockReturnValue(of(DEMO_USER));
    const { fixture, navigateSpy } = setup(createAuth({ login }));

    submit(fixture);

    expect(login).toHaveBeenCalledWith(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(navigateSpy).toHaveBeenCalledWith(["/facilities"]);
  });

  it("shows the spinner and disables the button while the request is pending", () => {
    const pending = new Subject<AuthUser>();
    const { fixture } = setup(createAuth({ login: vi.fn().mockReturnValue(pending) }));

    submit(fixture);

    const button = queryElement<HTMLButtonElement>(fixture, "button");
    expect(button.disabled).toBe(true);
    expect(fixture.debugElement.query(By.css("mat-spinner"))).toBeTruthy();

    pending.next(DEMO_USER);
    pending.complete();
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
  });

  it("ignores a second submit while one is already in flight", () => {
    const pending = new Subject<AuthUser>();
    const login = vi.fn().mockReturnValue(pending);
    const { fixture } = setup(createAuth({ login }));

    submit(fixture);
    submit(fixture);

    expect(login).toHaveBeenCalledTimes(1);
  });

  it("shows the error message from a failed login", () => {
    const login = vi
      .fn()
      .mockReturnValue(throwError(() => new Error("Invalid email or password.")));
    const { fixture } = setup(createAuth({ login }));

    submit(fixture);

    const alert = queryElement<HTMLElement>(fixture, '[role="alert"]');
    expect(alert.textContent?.trim()).toBe("Invalid email or password.");
  });

  it("shows a fallback error message for a non-Error rejection", () => {
    const login = vi.fn().mockReturnValue(throwError(() => "network down"));
    const { fixture } = setup(createAuth({ login }));

    submit(fixture);

    const alert = queryElement<HTMLElement>(fixture, '[role="alert"]');
    expect(alert.textContent?.trim()).toBe("Unable to sign in.");
  });

  it("clears a previous error message and re-enables the button after a retry succeeds", () => {
    const login = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error("Invalid email or password.")))
      .mockReturnValueOnce(of(DEMO_USER));
    const { fixture } = setup(createAuth({ login }));

    submit(fixture);
    expect(fixture.debugElement.query(By.css('[role="alert"]'))).toBeTruthy();

    submit(fixture);

    expect(fixture.debugElement.query(By.css('[role="alert"]'))).toBeFalsy();
  });
});
