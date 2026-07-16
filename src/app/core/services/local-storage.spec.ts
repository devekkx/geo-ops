import { TestBed } from "@angular/core/testing";

import { LocalStorageService } from "./local-storage";

describe("LocalStorageService", () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when the key is missing", () => {
    expect(service.getItem("missing")).toBeNull();
  });

  it("round-trips a JSON-serializable value", () => {
    service.setItem("key", { a: 1, b: ["x", "y"] });

    expect(service.getItem("key")).toEqual({ a: 1, b: ["x", "y"] });
  });

  it("returns null for malformed JSON instead of throwing", () => {
    localStorage.setItem("bad", "{not json");

    expect(service.getItem("bad")).toBeNull();
  });

  it("removes a stored value", () => {
    service.setItem("key", "value");
    service.removeItem("key");

    expect(service.getItem("key")).toBeNull();
  });
});
