import { Routes } from "@angular/router";

import { authGuard, guestGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "facilities"
  },
  {
    path: "login",
    loadComponent: () => import("./features/auth/login/login").then((m) => m.Login),
    canActivate: [guestGuard],
    title: "Sign in · Facility Manager"
  },
  {
    path: "facilities",
    loadComponent: () => import("./layout/main-layout/main-layout").then((m) => m.MainLayout),
    canActivate: [authGuard],
    loadChildren: () => import("./features/facilities/routes").then((m) => m.facilitiesRoutes)
  },
  {
    path: "**",
    redirectTo: "facilities"
  }
];
