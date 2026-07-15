import { Component, computed, input } from '@angular/core';

import type { FacilityStatus } from '../../core/models/facility.model';

const STYLES: Record<FacilityStatus, { pill: string; dot: string }> = {
  Active: { pill: 'bg-green-50 text-green-700', dot: 'bg-green-600' },
  Inactive: { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  Maintenance: { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
};

@Component({
  selector: 'geo-status-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      [class]="styles().pill"
    >
      <span class="size-1.5 rounded-full" [class]="styles().dot" aria-hidden="true"></span>
      {{ status() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<FacilityStatus>();

  protected readonly styles = computed(() => STYLES[this.status()]);
}
