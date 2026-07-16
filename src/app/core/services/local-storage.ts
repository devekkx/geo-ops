import { Service } from "@angular/core";

@Service()
export class LocalStorageService {
  /** Reads and parses the JSON value stored under `key`, or `null` if it's absent or malformed. */
  public getItem<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Serialises `value` to JSON and stores it under `key`. */
  public setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** Removes the value stored under `key`. */
  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
