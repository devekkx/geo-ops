import { TestBed } from "@angular/core/testing";

import { Clock } from "./clock";

describe("Clock", () => {
  it("returns the current date", () => {
    const clock = TestBed.inject(Clock);

    const result = clock.now();

    expect(result).toBeInstanceOf(Date);
  });
});
