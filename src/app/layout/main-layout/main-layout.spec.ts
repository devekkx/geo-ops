import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, provideRouter, Router } from "@angular/router";
import { Subject } from "rxjs";

import type { AuthUser } from "@core/interfaces/auth";
import type { AuthPort } from "@core/tokens/auth";
import { AUTH_PORT } from "@core/tokens/auth";
import { MainLayout } from "./main-layout";

interface FakeRoute {
  firstChild: FakeRoute | null;
  snapshot?: { data: Record<string, unknown> };
}

const USER: AuthUser = {
  uid: "1",
  email: "jane@example.com",
  displayName: "Jane Doe"
};

const DEFAULT_ROUTE: FakeRoute = { firstChild: null, snapshot: { data: {} } };

function createAuth(overrides: Partial<AuthPort> = {}): AuthPort {
  return {
    currentUser: signal<AuthUser | null>(USER),
    isAuthenticated: signal(true),
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides
  };
}

function queryElement<T extends Element>(
  fixture: ComponentFixture<MainLayout>,
  selector: string
): T {
  return fixture.debugElement.query(By.css(selector)).nativeElement as T;
}

function setup(options: { auth?: AuthPort; route?: FakeRoute } = {}): ComponentFixture<MainLayout> {
  const auth = options.auth ?? createAuth();
  const route = options.route ?? DEFAULT_ROUTE;

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AUTH_PORT, useValue: auth },
      { provide: ActivatedRoute, useValue: route as unknown as ActivatedRoute }
    ]
  });

  const fixture = TestBed.createComponent(MainLayout);
  fixture.detectChanges();
  return fixture;
}

function findButtonByText(fixture: ComponentFixture<MainLayout>, text: string): HTMLButtonElement {
  const button = fixture.debugElement
    .queryAll(By.css("button"))
    .find((candidate) =>
      (candidate.nativeElement as HTMLButtonElement).textContent?.includes(text)
    );

  if (!button) {
    throw new Error(`No button found containing text "${text}"`);
  }
  return button.nativeElement as HTMLButtonElement;
}

describe("MainLayout", () => {
  it("computes initials from the current user's display name", () => {
    const fixture = setup();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("JD");
  });

  it("shows no initials when there is no current user", () => {
    const fixture = setup({ auth: createAuth({ currentUser: signal(null) }) });

    const avatar = queryElement<HTMLElement>(fixture, "aside .rounded-full");
    expect(avatar.textContent?.trim()).toBe("");
  });

  it("falls back to the default title and empty subtitle without route data", () => {
    const fixture = setup();

    const title = queryElement<HTMLElement>(fixture, "h1");
    expect(title.textContent?.trim()).toBe("Facility Manager");
    expect(fixture.debugElement.query(By.css("header p"))).toBeFalsy();
  });

  it("reflects the title and subtitle from the deepest child route's data", () => {
    const route: FakeRoute = {
      firstChild: {
        firstChild: null,
        snapshot: { data: { pageTitle: "Facilities", pageSubtitle: "All locations" } }
      }
    };
    const fixture = setup({ route });

    const title = queryElement<HTMLElement>(fixture, "h1");
    const subtitle = queryElement<HTMLElement>(fixture, "header p");

    expect(title.textContent?.trim()).toBe("Facilities");
    expect(subtitle.textContent?.trim()).toBe("All locations");
  });

  it("walks past shallower route data to use the deepest child's data", () => {
    const route: FakeRoute = {
      firstChild: {
        snapshot: { data: { pageTitle: "Shallow Page" } },
        firstChild: {
          firstChild: null,
          snapshot: { data: { pageTitle: "Deepest Page" } }
        }
      }
    };
    const fixture = setup({ route });

    const title = queryElement<HTMLElement>(fixture, "h1");
    expect(title.textContent?.trim()).toBe("Deepest Page");
  });

  it("opens and closes the mobile nav", () => {
    const fixture = setup();
    const aside = queryElement<HTMLElement>(fixture, "aside");
    const openButton = queryElement<HTMLButtonElement>(fixture, '[aria-label="Open menu"]');
    const closeButton = queryElement<HTMLButtonElement>(fixture, '[aria-label="Close menu"]');

    expect(aside.classList.contains("translate-x-0")).toBe(false);

    openButton.click();
    fixture.detectChanges();
    expect(aside.classList.contains("translate-x-0")).toBe(true);

    closeButton.click();
    fixture.detectChanges();
    expect(aside.classList.contains("translate-x-0")).toBe(false);
  });

  it("navigates to /facilities/new when creating a new facility", () => {
    const fixture = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    findButtonByText(fixture, "New facility").click();

    expect(navigateSpy).toHaveBeenCalledWith(["/facilities/new"]);
  });

  it("keeps showing the correct title after a real NavigationEnd event arrives", () => {
    const events = new Subject<unknown>();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events, navigate: vi.fn().mockResolvedValue(true) } },
        { provide: AUTH_PORT, useValue: createAuth() },
        { provide: ActivatedRoute, useValue: DEFAULT_ROUTE as unknown as ActivatedRoute }
      ]
    });

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    events.next({ type: "not-a-navigation-end" });
    events.next(new NavigationEnd(1, "/facilities", "/facilities"));
    fixture.detectChanges();

    const title = queryElement<HTMLElement>(fixture, "h1");
    expect(title.textContent?.trim()).toBe("Facility Manager");
  });

  it("logs out and navigates to /login", () => {
    const logout = vi.fn();
    const fixture = setup({ auth: createAuth({ logout }) });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    const signOutButton = queryElement<HTMLButtonElement>(fixture, '[aria-label="Sign out"]');
    signOutButton.click();

    expect(logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(["/login"]);
  });
});
