import { Component, Input } from '@angular/core';

import { IResult } from '../../domain-model';

@Component({
  selector: 'ld-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {
  @Input() isManual: boolean;
  @Input() status: IResult;
}
