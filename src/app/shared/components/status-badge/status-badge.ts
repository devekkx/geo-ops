import { Component, computed, input } from "@angular/core";

import type { FacilityStatus } from "@core/interfaces/facility";
import { SentenceCasePipe } from "@shared/pipes/sentence-case";

const STYLES: Record<FacilityStatus, { pill: string; dot: string }> = {
  active: { pill: "bg-brand-success-50 text-brand-success-700", dot: "bg-brand-success-500" },
  inactive: { pill: "bg-brand-gray-100 text-brand-gray-600", dot: "bg-brand-gray-400" },
  maintenance: { pill: "bg-brand-warning-50 text-brand-warning-700", dot: "bg-brand-warning-500" }
};

@Component({
  selector: "geo-status-badge",
  imports: [SentenceCasePipe],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      [class]="styles().pill"
    >
      <span class="size-1.5 rounded-full" [class]="styles().dot" aria-hidden="true"></span>
      {{ status() | sentenceCase }}
    </span>
  `
})
export class StatusBadge {
  readonly status = input.required<FacilityStatus>();

  protected readonly styles = computed(() => STYLES[this.status()]);
}
