import { Component, Input } from '@angular/core';

export interface IStatistics {
  passed: number;
  pending: number;
  failed: number;
  manual: number;
  total: number;
}

@Component({
  selector: 'ld-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent {
  @Input() name: string;
  @Input() statistics: IStatistics;
}
