import { FormControl } from "@angular/forms";

import { rangeValidator } from "./range.validator";

describe("rangeValidator", () => {
  it("returns null when the control has no value", () => {
    const validator = rangeValidator(-90, 90);
    expect(validator(new FormControl<number | null>(null))).toBeNull();
  });

  it("returns null when the value is within range", () => {
    const validator = rangeValidator(-90, 90);
    expect(validator(new FormControl<number | null>(45.5))).toBeNull();
  });

  it("returns null at the exact boundaries", () => {
    const validator = rangeValidator(-90, 90);
    expect(validator(new FormControl<number | null>(-90))).toBeNull();
    expect(validator(new FormControl<number | null>(90))).toBeNull();
  });

  it("returns a range error when the value is below the minimum", () => {
    const validator = rangeValidator(-90, 90);
    expect(validator(new FormControl<number | null>(-91))).toEqual({
      range: { min: -90, max: 90 }
    });
  });

  it("returns a range error when the value is above the maximum", () => {
    const validator = rangeValidator(-180, 180);
    expect(validator(new FormControl<number | null>(181))).toEqual({
      range: { min: -180, max: 180 }
    });
  });

  it("returns a range error for a non-numeric value", () => {
    const validator = rangeValidator(-90, 90);
    expect(validator(new FormControl<number | null>(Number.NaN))).toEqual({
      range: { min: -90, max: 90 }
    });
  });
});
