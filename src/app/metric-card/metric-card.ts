import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-metric-card',
  styleUrl: './metric-card.scss',
  templateUrl: './metric-card.html',
})
export class MetricCard {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly supportingText = input.required<string>();
  readonly progress = input<number | null>(null);
  readonly progressLabel = input<string | null>(null);
}
