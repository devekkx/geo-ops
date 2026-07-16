import type { MatIconRegistry } from "@angular/material/icon";
import type { DomSanitizer } from "@angular/platform-browser";

import { ICON_NAMES, registerIcons } from "./icon-registry.provider";

describe("registerIcons", () => {
  it("registers every named icon with a sanitized resource URL", () => {
    const addSvgIcon = vi.fn();
    const iconRegistry = { addSvgIcon } as unknown as MatIconRegistry;
    const bypassSecurityTrustResourceUrl = vi.fn((url: string) => url);
    const sanitizer = { bypassSecurityTrustResourceUrl } as unknown as DomSanitizer;

    registerIcons(iconRegistry, sanitizer);

    expect(addSvgIcon).toHaveBeenCalledTimes(ICON_NAMES.length);
    expect(bypassSecurityTrustResourceUrl).toHaveBeenCalledWith("icons/menu.svg");
    expect(addSvgIcon).toHaveBeenCalledWith("menu", "icons/menu.svg");
  });
});
