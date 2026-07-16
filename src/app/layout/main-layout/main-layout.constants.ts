export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Facilities", path: "/facilities", icon: "nav-facilities" },
  { label: "Map overview", path: "/facilities/map", icon: "nav-map" }
];
