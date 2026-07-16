import { inject, provideAppInitializer, type EnvironmentProviders } from "@angular/core";
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

/** Registers every icon in {@link ICON_NAMES} with Angular Material's icon registry as a trusted SVG. */
export function registerIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer): void {
  for (const name of ICON_NAMES) {
    iconRegistry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(`icons/${name}.svg`));
  }
}

/** Provides an app initialiser that registers all application icons on startup. */
export function provideIconRegistry(): EnvironmentProviders {
  return provideAppInitializer(() => {
    registerIcons(inject(MatIconRegistry), inject(DomSanitizer));
  });
}
