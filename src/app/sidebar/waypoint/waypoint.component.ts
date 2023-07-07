import { Component, Input } from '@angular/core';
import { Waypoint } from 'src/app/shared/Waypoint';
import { DetailLevel } from 'src/app/state-control.service';

@Component({
  selector: 'app-waypoint',
  templateUrl: './waypoint.component.html',
  styleUrls: ['./waypoint.component.css']
})
export class WaypointComponent {
  @Input() waypoint!: Waypoint;

  navigatableChange(event: any) {
    if (this.waypoint.navigatable) {
      this.waypoint.detailLevel = DetailLevel.HIGH;
    } else {
      this.waypoint.detailLevel = undefined;
    }
  }
}
