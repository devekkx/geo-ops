import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { NotificationService } from "./notification";

describe("NotificationService", () => {
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let service: NotificationService;

  beforeEach(() => {
    snackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }]
    });

    service = TestBed.inject(NotificationService);
  });

  it("opens a success snackbar with the success panel class and default duration", () => {
    service.success("Facility saved");

    expect(snackBar.open).toHaveBeenCalledWith("Facility saved", "Dismiss", {
      duration: 4000,
      panelClass: ["geo-snackbar", "geo-snackbar--success"]
    });
  });

  it("opens an error snackbar with the error panel class and a longer duration", () => {
    service.error("Facility could not be saved");

    expect(snackBar.open).toHaveBeenCalledWith("Facility could not be saved", "Dismiss", {
      duration: 6000,
      panelClass: ["geo-snackbar", "geo-snackbar--error"]
    });
  });
});
