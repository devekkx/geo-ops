import { firstValueFrom } from "rxjs";

import { MockAuthService } from "./mock-auth.service";

describe("MockAuthService", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("starts unauthenticated when no session is stored", () => {
    const service = new MockAuthService();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it("logs in with the demo credentials and persists the session", async () => {
    const service = new MockAuthService();
    const user = await firstValueFrom(service.login("ama.owusu@amalitech.com", "demo1234"));

    expect(user).toEqual(expect.objectContaining({ email: "ama.owusu@amalitech.com" }));
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem("geo-ops.auth-user")).not.toBeNull();
  });

  it("rejects incorrect credentials without authenticating", async () => {
    const service = new MockAuthService();

    await expect(
      firstValueFrom(service.login("ama.owusu@amalitech.com", "wrong-password"))
    ).rejects.toBeInstanceOf(Error);
    expect(service.isAuthenticated()).toBe(false);
  });

  it("clears the session on logout", async () => {
    const service = new MockAuthService();
    await firstValueFrom(service.login("ama.owusu@amalitech.com", "demo1234"));
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem("geo-ops.auth-user")).toBeNull();
  });
});
