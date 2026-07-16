import type { AuthUser } from "@core/interfaces/auth";

export const SESSION_KEY = "geo-ops.auth-user";
export const LOGIN_LATENCY_MS = 600;

export const DEMO_USER: AuthUser = {
  uid: "demo-emmanuel-kpendo",
  email: "emmanuelkpendo1@gmail.com",
  displayName: "Emmanuel Komla Kpendo"
};
export const DEMO_PASSWORD = "demo1234";

export const DEMO_CREDENTIALS = { email: DEMO_USER.email, password: DEMO_PASSWORD };
