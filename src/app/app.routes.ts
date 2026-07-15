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
    children: [
      {
        path: "",
        pathMatch: "full",
        loadComponent: () =>
          import("./features/facilities/facility-list/facility-list").then((m) => m.FacilityList),
        title: "Facilities · Facility Manager",
        data: {
          pageTitle: "Facilities",
          pageSubtitle: "Browse and manage every registered facility"
        }
      },
      {
        path: "map",
        loadComponent: () =>
          import("./features/facilities/facilities-map-overview/facilities-map-overview").then(
            (m) => m.FacilitiesMapOverview
          ),
        title: "Map overview · Facility Manager",
        data: {
          pageTitle: "Map overview",
          pageSubtitle: "Every facility plotted by location"
        }
      },
      {
        path: "new",
        loadComponent: () =>
          import("./features/facilities/facility-form/facility-form").then((m) => m.FacilityForm),
        title: "New facility · Facility Manager",
        data: {
          pageTitle: "New facility",
          pageSubtitle: "Register a facility in the network"
        }
      },
      {
        path: ":id/edit",
        loadComponent: () =>
          import("./features/facilities/facility-form/facility-form").then((m) => m.FacilityForm),
        title: "Edit facility · Facility Manager",
        data: {
          pageTitle: "Edit facility",
          pageSubtitle: "Update facility details"
        }
      },
      {
        path: ":id",
        loadComponent: () =>
          import("./features/facilities/facility-detail/facility-detail").then(
            (m) => m.FacilityDetail
          ),
        title: "Facility details · Facility Manager",
        data: {
          pageTitle: "Facility details",
          pageSubtitle: ""
        }
      }
    ]
  },
  {
    path: "**",
    redirectTo: "facilities"
  }
];
