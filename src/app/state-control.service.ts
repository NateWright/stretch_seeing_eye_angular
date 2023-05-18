import { EventEmitter, Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

export enum tool {
  PAN,
  ADD,
  SELECT,
  REMOVE,
  CONNECTION
}

export interface waypoint {
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  connections: waypoint[];
}

export interface feature {
  name: string;
  description: string;
  p1: { x: number, y: number };
  p2: { x: number, y: number };
}

@Injectable({
  providedIn: 'root'
})
export class StateControlService {
  toolSelected = tool.PAN;
  waypoints: waypoint[] = [];
  features: feature[] = [];
  showEditWaypoint = new EventEmitter<waypoint | undefined>();
  showEditFeature = new EventEmitter<feature | undefined>();
  redraw = new EventEmitter<void>();

  resolution: number = 0.05;
  origin: { x: number, y: number } = { x: -100, y: -100 };
  positionOffset = { x: 0, y: 0 };
  imgSize = { width: 0, height: 0 };

  importWaypointString = "";
  importFeatureString = "";

  constructor(private clipboard: Clipboard) { }

  importWaypointData() {
    for (let str of this.importWaypointString.split('\n')) {
      let data = str.split(',').map(x => x.trim());
      this.waypoints.push({
        name: data[0],
        width: 10,
        height: 10,
        x: (parseFloat(data[1]) - this.origin.x) / this.resolution,
        y: this.imgSize.height - (parseFloat(data[2]) - this.origin.y) / this.resolution,
        connections: []
      });
    }
    this.importWaypointString.split('\n').forEach((object, index) => {
      let data = object.split(',').map(x => x.trim());
      for (let i = 8; i < data.length; i++) {
        let waypoint = this.waypoints.find(x => x.name == data[i]);
        if (waypoint) {
          this.waypoints[index].connections.push(waypoint);
        }
      }
    });
    this.redraw.emit();
  }

  exportWaypointData() {
    let data = "";
    for (let waypoint of this.waypoints) {
      let str = waypoint.name;
      str += ',' + (waypoint.x * this.resolution + this.origin.x).toString();                             // x
      str += ',' + ((this.imgSize.height - waypoint.y) * this.resolution + this.origin.y).toString();     // y
      str += ', 0';                                                                                      // z
      str += ', 0';                                                                                 // x rot
      str += ', 0';                                                                                 // y rot
      str += ', 0';                                                                                 // z rot
      str += ', 1';                                                                                 // w rot
      for (let connection of waypoint.connections) {
        str += ',' + connection.name;
      }
      data += str + '\n';
    }
    this.clipboard.copy(data);
  }

  importFeatureData() {
    for (let str of this.importFeatureString.split('\n')) {
      let data = str.split(',').map(x => x.trim());
      this.features.push({
        name: data[0],
        description: data[1],
        p1: {
          x: (parseFloat(data[2]) - this.origin.x) / this.resolution,
          y: this.imgSize.height - (parseFloat(data[3]) - this.origin.y) / this.resolution
        },
        p2: {
          x: (parseFloat(data[4]) - this.origin.x) / this.resolution,
          y: this.imgSize.height - (parseFloat(data[5]) - this.origin.y) / this.resolution
        }
      });
    }
    this.redraw.emit();
  }
  exportFeatureData() {
    let data = "";
    for (let feature of this.features) {
      let str = feature.name;
      str += ',' + feature.description;
      str += ',' + (feature.p1.x * this.resolution + this.origin.x).toString();                             // x
      str += ',' + ((this.imgSize.height - feature.p1.y) * this.resolution + this.origin.y).toString();     // y
      str += ',' + (feature.p2.x * this.resolution + this.origin.x).toString();                             // x
      str += ',' + ((this.imgSize.height - feature.p2.y) * this.resolution + this.origin.y).toString();     // y
      data += str + '\n';
    }
    this.clipboard.copy(data);
  }
}
