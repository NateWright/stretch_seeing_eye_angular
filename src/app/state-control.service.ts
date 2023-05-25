import { EventEmitter, Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

export enum tool {
  PAN,
  ADD,
  SELECT,
  REMOVE,
  CONNECTION
}

export enum AddTool {
  WAYPOINT,
  FEATURE
}

export enum DetailLevel {
  LOW,
  MEDIUM,
  HIGH
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
  path: Path2D | undefined;
  detailLevel: DetailLevel;
}

@Injectable({
  providedIn: 'root'
})
export class StateControlService {
  toolSelected = tool.PAN;
  addToolSelected = AddTool.WAYPOINT;
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
  importFeatureString = "";

  constructor(private clipboard: Clipboard) { }

  importWaypointData() {
    for (let str of this.importWaypointString.split('\n')) {
      if (str == "") continue;
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
    for (let str of this.importFeatureString.split('\n')) {
      if (str == "") continue;

      let data = str.split(',').map(x => x.trim());

      let index = 0;
      let name = data[index++];
      let description = data[index++];
      let count = parseInt(data[index++]);
      let points: Point[] = [];

      for (let i = 0; i < count; i++) {
        points.push({
          x: (parseFloat(data[index++]) - this.origin.x) / this.resolution,
          y: this.imgSize.height - (parseFloat(data[index++]) - this.origin.y) / this.resolution,
          width: 10,
          height: 10
        });
      }

      let detailLevel = data[index] == 'LOW' ? DetailLevel.LOW : data[index] == 'MEDIUM' ? DetailLevel.MEDIUM : DetailLevel.HIGH;
      index++;

      this.features.push({
        name: name,
        description: description,
        points: points,
        detailLevel: detailLevel,
        path: new Path2D()
      });
    }

    console.log(this.features);
    this.redraw.emit();
  }
  exportFeatureData() {
    let data = "";
    for (let feature of this.features) {
      let str = feature.name;
      str += ',' + feature.description;
      str += ',' + feature.points.length;
      for (let point of feature.points) {
        str += ',' + (point.x * this.resolution + this.origin.x).toString();                             // x
        str += ',' + ((this.imgSize.height - point.y) * this.resolution + this.origin.y).toString();     // y
      }
      str += ',' + (feature.detailLevel == DetailLevel.LOW ? 'LOW' : feature.detailLevel == DetailLevel.MEDIUM ? 'MEDIUM' : 'HIGH');
      data += str + '\n';
    }
    this.clipboard.copy(data);
  }
}
