import { Component, Input } from '@angular/core';
import { Door } from 'src/app/shared/Door';
import { StateControlService } from 'src/app/state-control.service';

@Component({
  selector: 'app-door',
  templateUrl: './door.component.html',
  styleUrls: ['./door.component.css']
})
export class DoorComponent {
  @Input() door!: Door;
  constructor(private stateControl: StateControlService) { }
  addDoor() {
    this.door.insidePoint = { x: this.door.entrancePoint.x + 10, y: this.door.entrancePoint.y };
    this.stateControl.redraw.emit();
  }
}
