import { EventEmitter, Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { Waypoint } from './shared/Waypoint';
import { Door } from './shared/Door';
import { Point } from './shared/BaseObject';

export enum tool {
  PAN,
  ADD,
  SELECT,
  REMOVE,
  CONNECTION
}

export enum AddTool {
  WAYPOINT,
  DOOR,
  FEATURE
}

export enum DetailLevel {
  LOW,
  MEDIUM,
  HIGH
}

@Injectable({
  providedIn: 'root'
})
export class StateControlService {
  toolSelected = tool.PAN;
  addToolSelected = AddTool.WAYPOINT;
  idCounter = 0;
  waypoints = new Map<number, Waypoint>();
  doors = new Map<number, Door>();
  showEdit = new EventEmitter<Waypoint | Door | undefined>();
  redraw = new EventEmitter<void>();

  resolution: number = 0.05;
  origin: { x: number, y: number } = { x: -100, y: -100 };
  positionOffset = { x: 0, y: 0 };
  imgSize = { width: 0, height: 0 };

  importString = "";

  constructor(private clipboard: Clipboard) { }

  importData() {
    console.log(this.importString);
    let data = this.importString.split('\n');
    let waypoints = new Map<number, Waypoint>();
    let doors = new Map<number, Door>();
    let max = 0;
    for (let line of data) {
      if (line == "") continue;
      if (line.startsWith("Waypoint")) {
        let waypoint = new Waypoint(0, "", { x: 0, y: 0 });
        waypoint.import(line, waypoints, doors, this.resolution, this.origin.x, this.origin.y);
        waypoints.set(waypoint.id, waypoint);
        max = Math.max(max, waypoint.id);
      } else if (line.startsWith("Door")) {
        let door = new Door(0, "", "", { x: 0, y: 0 }, DetailLevel.LOW);
        door.import(line, this.resolution, this.origin.x, this.origin.y);
        doors.set(door.id, door);
        max = Math.max(max, door.id);
      }
    }
    this.idCounter = max + 1;
    this.waypoints = waypoints;
    this.doors = doors;
    this.redraw.emit();
  }


  exportData() {
    let data = "";
    for (let door of this.doors.values()) {
      data += door.export(this.resolution, this.origin.x, this.origin.y) + '\n';
    }
    for (let waypoint of this.waypoints.values()) {
      data += waypoint.export(this.resolution, this.origin.x, this.origin.y) + '\n';
    }

    this.clipboard.copy(data);
  }
}
