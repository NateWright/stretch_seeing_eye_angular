import { Component, OnDestroy, OnInit } from '@angular/core';
import { StateControlService, Feature, tool, Waypoint, DetailLevel, AddTool } from '../state-control.service';
import { Subscription } from 'rxjs';

enum editType {
  WAYPOINT,
  FEATURE,
  NONE
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly tool = tool;
  readonly editType = editType;
  readonly DetailLevel = DetailLevel;
  readonly AddTool = AddTool;
  editSubWaypoint!: Subscription;
  editSubFeature!: Subscription;
  waypoint: Waypoint | undefined = undefined;
  feature: Feature | undefined = undefined;
  objectType: editType = editType.NONE;

  constructor(public stateControl: StateControlService) { }

  ngOnInit(): void {
    this.editSubWaypoint = this.stateControl.showEditWaypoint.subscribe(
      (waypoint: Waypoint | undefined) => {
        if (waypoint == undefined) {
          this.objectType = editType.NONE;
          this.waypoint = undefined;
          this.feature = undefined;
          return;
        }
        this.objectType = editType.WAYPOINT;
        this.waypoint = waypoint;
        this.feature = undefined;

      }
    );
    this.editSubFeature = this.stateControl.showEditFeature.subscribe(
      (feature: Feature | undefined) => {
        if (feature == undefined) {
          this.objectType = editType.NONE;
          this.waypoint = undefined;
          this.feature = undefined;
          return;
        }
        this.objectType = editType.FEATURE;
        this.waypoint = undefined;
        this.feature = feature;
      }
    );

  }

  ngOnDestroy(): void {
    this.editSubWaypoint.unsubscribe();
    this.editSubFeature.unsubscribe();
  }

  panClicked() {
    this.stateControl.toolSelected = tool.PAN;
  }

  addClicked() {
    this.stateControl.toolSelected = tool.ADD;
    this.waypoint = undefined;
    this.feature = undefined;
    this.objectType = editType.NONE;
  }
  selectClicked() {
    this.stateControl.toolSelected = tool.SELECT;
    this.waypoint = undefined;
    this.feature = undefined;
    this.objectType = editType.NONE;
  }
  connectClicked() {
    this.stateControl.toolSelected = tool.CONNECTION;
  }
  removeClicked() {
    this.stateControl.toolSelected = tool.REMOVE;
  }
}
