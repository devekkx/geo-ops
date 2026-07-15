import { SentenceCasePipe } from "./sentence-case.pipe";

describe("SentenceCasePipe", () => {
  const pipe = new SentenceCasePipe();

  it("capitalizes the first letter and lowercases the rest", () => {
    expect(pipe.transform("active")).toBe("Active");
    expect(pipe.transform("MAINTENANCE")).toBe("Maintenance");
  });

  it("returns an empty string unchanged", () => {
    expect(pipe.transform("")).toBe("");
  });
});
