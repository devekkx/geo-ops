import { TestBed } from "@angular/core/testing";

import { StatusBadge } from "./status-badge";

function nativeElementOf(fixture: { nativeElement: unknown }): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe("StatusBadge", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusBadge] });
  });

  it("renders the sentence-cased label for an active status", () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput("status", "active");
    fixture.detectChanges();

    expect(nativeElementOf(fixture).textContent?.trim()).toBe("Active");
  });

  it("renders the sentence-cased label for a maintenance status", () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput("status", "maintenance");
    fixture.detectChanges();

    expect(nativeElementOf(fixture).textContent?.trim()).toBe("Maintenance");
  });

  it("applies different pill styles for different statuses", () => {
    const activeFixture = TestBed.createComponent(StatusBadge);
    activeFixture.componentRef.setInput("status", "active");
    activeFixture.detectChanges();

    const inactiveFixture = TestBed.createComponent(StatusBadge);
    inactiveFixture.componentRef.setInput("status", "inactive");
    inactiveFixture.detectChanges();

    const activePill = nativeElementOf(activeFixture).querySelector("span");
    const inactivePill = nativeElementOf(inactiveFixture).querySelector("span");

    expect(activePill?.className).not.toBe(inactivePill?.className);
  });
});
