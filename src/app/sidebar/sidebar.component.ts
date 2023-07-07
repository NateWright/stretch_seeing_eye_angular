import { Component, OnDestroy, OnInit } from '@angular/core';
import { StateControlService, tool, DetailLevel, AddTool } from '../state-control.service';
import { Subscription } from 'rxjs';
import { Door } from '../shared/Door';
import { Waypoint } from '../shared/Waypoint';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly tool = tool;
  readonly DetailLevel = DetailLevel;
  readonly AddTool = AddTool;
  editSub!: Subscription;
  selectedWaypoint: Waypoint | undefined = undefined;
  selectedDoor: Door | undefined = undefined;

  constructor(public stateControl: StateControlService) { }

  ngOnInit(): void {
    this.editSub = this.stateControl.showEdit.subscribe(
      (obj) => {
        if (obj == undefined) {
          this.selectedDoor = undefined;
          this.selectedWaypoint = undefined;
        } else if (obj instanceof Door) {
          this.selectedDoor = obj;
          this.selectedWaypoint = undefined;
        } else if (obj instanceof Waypoint) {
          this.selectedDoor = undefined;
          this.selectedWaypoint = obj;
        }
      }
    );

  }

  ngOnDestroy(): void {
    this.editSub.unsubscribe();
  }

  panClicked() {
    this.stateControl.toolSelected = tool.PAN;
  }

  addClicked() {
    this.stateControl.toolSelected = tool.ADD;
  }
  selectClicked() {
    this.stateControl.toolSelected = tool.SELECT;
  }
  connectClicked() {
    this.stateControl.toolSelected = tool.CONNECTION;
  }
  removeClicked() {
    this.stateControl.toolSelected = tool.REMOVE;
  }
}
