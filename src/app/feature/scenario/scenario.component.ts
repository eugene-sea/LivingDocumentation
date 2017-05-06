import { Component, Input } from '@angular/core';

import { ILivingDocumentation, IScenario } from '../../domain-model';

@Component({
  selector: 'ld-scenario',
  templateUrl: './scenario.component.html',
  styleUrls: ['./scenario.component.css']
})
export class ScenarioComponent {
  @Input() documentation: ILivingDocumentation;
  @Input() scenario: IScenario;
  @Input() isBackground = false;
}
