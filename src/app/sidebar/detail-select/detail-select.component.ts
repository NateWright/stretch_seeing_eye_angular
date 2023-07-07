import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DetailLevel, StateControlService } from 'src/app/state-control.service';

@Component({
  selector: 'app-detail-select',
  templateUrl: './detail-select.component.html',
  styleUrls: ['./detail-select.component.css']
})
export class DetailSelectComponent {
  @Input() detailLevel!: DetailLevel;
  @Output() detailLevelChange = new EventEmitter<DetailLevel>();
  readonly DetailLevel = DetailLevel;
  constructor(public stateControl: StateControlService) { }
}
