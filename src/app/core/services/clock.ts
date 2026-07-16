import { Service } from "@angular/core";

@Service()
export class Clock {
  /** Returns the current date and time. */
  public now(): Date {
    return new Date();
  }
}
