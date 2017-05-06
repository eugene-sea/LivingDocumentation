import { Component, Input } from '@angular/core';

import { ITable } from '../../domain-model';

@Component({
  selector: 'ld-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  @Input() table: ITable;
  @Input() tests: string[];
}
