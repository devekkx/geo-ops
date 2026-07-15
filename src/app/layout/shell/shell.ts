import { toSignal } from "@angular/core/rxjs-interop";
import { Component, computed, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from "@angular/router";
import { filter } from "rxjs";

import { AUTH_PORT } from "../../core/auth/auth-port";

interface NavItem {
  label: string;
  path: string;
  iconPath: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Facilities",
    path: "/facilities",
    iconPath: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
  },
  {
    label: "Map overview",
    path: "/facilities/map",
    iconPath:
      "M9 20 3.6 17.9A1 1 0 0 1 3 17V5.5a1 1 0 0 1 1.4-.9L9 6.5m0 13.5 6-2.5m-6 2.5V6.5m6 11 4.6 1.9a1 1 0 0 0 1.4-.9V7a1 1 0 0 0-.6-.9L15 4m0 13V4m0 0-6 2.5"
  }
];

@Component({
  selector: "geo-shell",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: "./shell.html",
  styleUrl: "./shell.css"
})
export class Shell {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AUTH_PORT);

  protected readonly navItems = NAV_ITEMS;
  protected readonly user = this.auth.currentUser;

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  protected readonly pageTitle = computed(() => {
    this.navigationEnd();
    return (this.deepestRouteData()["pageTitle"] as string | undefined) ?? "Facility Manager";
  });

  protected readonly pageSubtitle = computed(() => {
    this.navigationEnd();
    return (this.deepestRouteData()["pageSubtitle"] as string | undefined) ?? "";
  });

  protected readonly initials = computed(() => {
    const name = this.user()?.displayName ?? "";
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  });

  protected onNewFacility(): void {
    void this.router.navigate(["/facilities/new"]);
  }

  protected onLogout(): void {
    this.auth.logout();
    void this.router.navigate(["/login"]);
  }

  private deepestRouteData(): Record<string, unknown> {
    let current = this.route.firstChild;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    return current?.snapshot.data ?? {};
  }
}
