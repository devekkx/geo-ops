import type { AuthUser } from "@core/interfaces/auth";

export const SESSION_KEY = "geo-ops.auth-user";
export const LOGIN_LATENCY_MS = 600;

export const DEMO_USER: AuthUser = {
  uid: "geoops-test-user",
  email: "test.user@geoops.com",
  displayName: "GeoOps Test User"
};
export const DEMO_PASSWORD = "demo1234";

export const DEMO_CREDENTIALS = { email: DEMO_USER.email, password: DEMO_PASSWORD };
