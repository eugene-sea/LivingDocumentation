import { Component, OnInit, Input } from '@angular/core';

import { ILivingDocumentation } from '../../domain-model';
import { format } from '../../util';

@Component({
  selector: 'ld-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css']
})
export class TagsComponent implements OnInit {
  @Input() documentation: ILivingDocumentation;
  @Input() tags: string[];

  tagsWithIssueUrl: { issueUrl: string; tag: string; }[];

  ngOnInit(): void {
    this.tagsWithIssueUrl = this.tags.map(t => {
      return { issueUrl: this.getIssueTrackingUrl(t), tag: t };
    });
  }

  private getIssueTrackingUrl(tag: string): string {
    const match = new RegExp(this.documentation.definition.issueTrackingRegExp, 'i').exec(tag);
    return match === null ? null : format(this.documentation.definition.issueTrackingUrl, ...match);
  }
}
