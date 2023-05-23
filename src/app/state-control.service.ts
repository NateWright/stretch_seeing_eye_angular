import { EventEmitter, Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

export enum tool {
  PAN,
  ADD,
  SELECT,
  REMOVE,
  CONNECTION
}

export interface Point {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Waypoint {
  name: string;
  p: Point;
  connections: Waypoint[];
}

export interface Feature {
  name: string;
  description: string;
  points: Point[];
}

@Injectable({
  providedIn: 'root'
})
export class StateControlService {
  toolSelected = tool.PAN;
  waypoints: Waypoint[] = [];
  features: Feature[] = [];
  showEditWaypoint = new EventEmitter<Waypoint | undefined>();
  showEditFeature = new EventEmitter<Feature | undefined>();
  redraw = new EventEmitter<void>();

  resolution: number = 0.05;
  origin: { x: number, y: number } = { x: -100, y: -100 };
  positionOffset = { x: 0, y: 0 };
  imgSize = { width: 0, height: 0 };

  importWaypointString = "";
  importFeatureString = "Bathroom,Entering Bathroom,11.350000000000009,4.050000000000011,15.550000000000011,0.5\nFeature245548,Test, 1.1500000000000057, 0.8500000000000085, 4.800000000000011,-1.7999999999999972";

  constructor(private clipboard: Clipboard) { }

  importWaypointData() {
    for (let str of this.importWaypointString.split('\n')) {
      let data = str.split(',').map(x => x.trim());
      this.waypoints.push({
        name: data[0],
        p: {
          width: 10,
          height: 10,
          x: (parseFloat(data[1]) - this.origin.x) / this.resolution,
          y: this.imgSize.height - (parseFloat(data[2]) - this.origin.y) / this.resolution
        },
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
      str += ',' + (waypoint.p.x * this.resolution + this.origin.x).toString();                             // x
      str += ',' + ((this.imgSize.height - waypoint.p.y) * this.resolution + this.origin.y).toString();     // y
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
    // for (let str of this.importFeatureString.split('\n')) {
    //   let data = str.split(',').map(x => x.trim());
    //   this.features.push({
    //     name: data[0],
    //     description: data[1],
    //     p1: {
    //       x: (parseFloat(data[2]) - this.origin.x) / this.resolution,
    //       y: this.imgSize.height - (parseFloat(data[3]) - this.origin.y) / this.resolution
    //     },
    //     p2: {
    //       x: (parseFloat(data[4]) - this.origin.x) / this.resolution,
    //       y: this.imgSize.height - (parseFloat(data[5]) - this.origin.y) / this.resolution
    //     }
    //   });
    // }
    // this.redraw.emit();
  }
  exportFeatureData() {
    // let data = "";
    // for (let feature of this.features) {
    //   let str = feature.name;
    //   str += ',' + feature.description;
    //   str += ',' + (feature.p1.x * this.resolution + this.origin.x).toString();                             // x
    //   str += ',' + ((this.imgSize.height - feature.p1.y) * this.resolution + this.origin.y).toString();     // y
    //   str += ',' + (feature.p2.x * this.resolution + this.origin.x).toString();                             // x
    //   str += ',' + ((this.imgSize.height - feature.p2.y) * this.resolution + this.origin.y).toString();     // y
    //   data += str + '\n';
    // }
    // this.clipboard.copy(data);
  }
}
