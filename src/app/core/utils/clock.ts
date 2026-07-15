import { Service } from "@angular/core";

@Service()
export class Clock {
  now(): Date {
    return new Date();
  }
}
