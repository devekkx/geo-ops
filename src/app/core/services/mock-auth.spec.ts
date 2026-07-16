import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";

import { DEMO_CREDENTIALS } from "@core/constants/auth";
import { MockAuthService } from "./mock-auth";

describe("MockAuthService", () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [MockAuthService] });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("starts unauthenticated when no session is stored", () => {
    const service = new MockAuthService();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it("restores an existing session from sessionStorage on construction", () => {
    const user = { uid: "1", email: DEMO_CREDENTIALS.email, displayName: "Demo User" };
    sessionStorage.setItem("geo-ops.auth-user", JSON.stringify(user));

    const service = TestBed.inject(MockAuthService);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(user);
  });

  it("logs in with the demo credentials and persists the session", async () => {
    const service = new MockAuthService();
    const user = await firstValueFrom(
      service.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
    );

    expect(user).toEqual(expect.objectContaining({ email: DEMO_CREDENTIALS.email }));
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem("geo-ops.auth-user")).not.toBeNull();
  });

  it("rejects incorrect credentials without authenticating", async () => {
    const service = new MockAuthService();

    await expect(
      firstValueFrom(service.login(DEMO_CREDENTIALS.email, "wrong-password"))
    ).rejects.toBeInstanceOf(Error);
    expect(service.isAuthenticated()).toBe(false);
  });

  it("clears the session on logout", async () => {
    const service = new MockAuthService();
    await firstValueFrom(service.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password));
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem("geo-ops.auth-user")).toBeNull();
  });
});
