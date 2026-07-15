import type { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) {
      return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) || numeric < min || numeric > max ? { range: { min, max } } : null;
  };
}
