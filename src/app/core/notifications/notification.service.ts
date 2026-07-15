import { Service, inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

const DEFAULT_DURATION_MS = 4000;
const ERROR_DURATION_MS = 6000;

@Service()
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, "Dismiss", {
      duration: DEFAULT_DURATION_MS,
      panelClass: ["geo-snackbar", "geo-snackbar--success"]
    });
  }

  error(message: string): void {
    this.snackBar.open(message, "Dismiss", {
      duration: ERROR_DURATION_MS,
      panelClass: ["geo-snackbar", "geo-snackbar--error"]
    });
  }
}
