import { inject, provideAppInitializer } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";

export const ICON_NAMES = [
  "menu",
  "close",
  "logout",
  "plus",
  "nav-facilities",
  "nav-map",
  "alert",
  "search",
  "eye",
  "pencil",
  "arrow-left"
] as const;

export function registerIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer): void {
  for (const name of ICON_NAMES) {
    iconRegistry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(`icons/${name}.svg`));
  }
}

export function provideIconRegistry() {
  return provideAppInitializer(() => {
    registerIcons(inject(MatIconRegistry), inject(DomSanitizer));
  });
}
