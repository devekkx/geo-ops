import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from "@angular/router";
import { filter } from "rxjs";

import { AUTH_PORT } from "@core/tokens/auth";
import { NAV_ITEMS } from "./main-layout.constants";

@Component({
  selector: "geo-main-layout",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: "./main-layout.html"
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AUTH_PORT);

  protected readonly navItems = NAV_ITEMS;
  protected readonly user = this.auth.currentUser;
  protected readonly navOpen = signal(false);

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

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
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
