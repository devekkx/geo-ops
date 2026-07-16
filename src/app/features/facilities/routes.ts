import { Routes } from "@angular/router";

export const facilitiesRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () => import("./facility-list/facility-list").then((m) => m.FacilityList),
    title: "Facilities · Facility Manager",
    data: {
      pageTitle: "Facilities",
      pageSubtitle: "Browse and manage every registered facility"
    }
  },
  {
    path: "map",
    loadComponent: () =>
      import("./facilities-map-overview/facilities-map-overview").then(
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
    loadComponent: () => import("./facility-form/facility-form").then((m) => m.FacilityForm),
    title: "New facility · Facility Manager",
    data: {
      pageTitle: "New facility",
      pageSubtitle: "Register a facility in the network"
    }
  },
  {
    path: ":id/edit",
    loadComponent: () => import("./facility-form/facility-form").then((m) => m.FacilityForm),
    title: "Edit facility · Facility Manager",
    data: {
      pageTitle: "Edit facility",
      pageSubtitle: "Update facility details"
    }
  },
  {
    path: ":id",
    loadComponent: () => import("./facility-detail/facility-detail").then((m) => m.FacilityDetail),
    title: "Facility details · Facility Manager",
    data: {
      pageTitle: "Facility details",
      pageSubtitle: ""
    }
  }
];
