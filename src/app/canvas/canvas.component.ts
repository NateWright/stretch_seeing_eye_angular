import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { StateControlService, Feature, Point, tool, Waypoint, DetailLevel, AddTool } from '../state-control.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  waypointUpdateSub!: Subscription;

  mapImage = new Image();
  ctx!: CanvasRenderingContext2D;
  mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  position: { x: number, y: number } = { x: 0, y: 0 };
  scale = 1.0;
  scaleTotal = 1.0;
  press = false;
  mouseDownOnWaypoint = false;
  mouseClick!: MouseEvent;
  waypoints: Waypoint[] = [];
  features: Feature[] = [];

  // selected: number = -1;
  selected: Point | undefined = undefined;
  connectP1: number = -1;
  connectP2: number = -1;

  constructor(public stateControl: StateControlService) {
    this.waypoints = stateControl.waypoints;
    this.features = stateControl.features;
    stateControl.positionOffset = this.position;
  }

  ngOnInit(): void {
    let ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
      this.mapImage.src = 'assets/map.png';
      // this.mapImage.src = 'assets/test.png';
      this.mapImage.onload = () => {
        this.draw()
        this.stateControl.imgSize = { width: this.mapImage.width, height: this.mapImage.height };
      }
    }

    this.waypointUpdateSub = this.stateControl.redraw.subscribe(() => {
      this.draw();
    }
    );
  }

  onScroll(event: WheelEvent) {
    // if (event.deltaY < 0) {
    //   this.scale = 1.1;
    //   this.scaleTotal *= 1.1;
    // } else {
    //   this.scale = 0.9;
    //   this.scaleTotal *= 0.9;
    // }
    // this.drawZoom();
  }

  onMouseMove(event: MouseEvent) {
    if (this.stateControl.toolSelected == tool.PAN && this.press) {
      this.position.x += event.movementX;
      this.position.y += event.movementY;
      this.draw();
    }
    if (this.stateControl.toolSelected == tool.SELECT) {
      if (this.press && this.selected && this.mouseDownOnWaypoint) {
        this.selected.x += event.movementX;
        this.selected.y += event.movementY;
        this.draw();
      }
    }
    this.mousePosition.x = event.offsetX;
    this.mousePosition.y = event.offsetY;
  }

  onMouseDown(event: MouseEvent) {
    this.press = true;
    this.mouseClick = event;
    if (this.stateControl.toolSelected == tool.SELECT) {
      this.selectObject(event);
    }
    if (this.selected) {
      this.mouseDownOnWaypoint = this.checkWaypointBounds(event, this.selected);
    }
  }
  onMouseUp(event: MouseEvent) {
    this.press = false;
    this.mouseDownOnWaypoint = false;

    switch (this.stateControl.toolSelected) {
      case tool.PAN:
        break;
      case tool.ADD:
        this.createObject(event);
        break;
      case tool.REMOVE:
        this.removeObject(event);
        break;
      case tool.SELECT:
        this.selectObject(event);
        break;
      case tool.CONNECTION:
        this.connectObject(event);
        break;

    }
    this.draw();
  }
  draw() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.ctx.restore();

    // Draw Map
    this.ctx.drawImage(this.mapImage, this.position.x / this.scaleTotal, this.position.y / this.scaleTotal);

    // Draw Waypoints
    this.waypoints.forEach((object, index) => {
      this.ctx.fillStyle = 'black';
      if (object.door) {
        switch (+object.door.detailLevel) {
          case DetailLevel.LOW:
            this.ctx.fillStyle = 'rgba(255, 255, 0, 1)';
            break;
          case DetailLevel.MEDIUM:
            this.ctx.fillStyle = 'rgba(255, 87, 51, 1)';
            break;
          case DetailLevel.HIGH:
            this.ctx.fillStyle = 'rgba(255, 0, 0, 1)';
            break;
          default:
            console.log('error')
        }
      }
      if (object.p == this.selected) {
        this.ctx.fillStyle = 'red';
      }
      if (index == this.connectP1) {
        this.ctx.fillStyle = 'green';
      }

      this.ctx.fillRect(object.p.x + (this.position.x / this.scaleTotal) - (object.p.width / 2), object.p.y + (this.position.y / this.scaleTotal) - (object.p.height / 2), object.p.width, object.p.height);

      for (let waypoint of object.connections) {
        this.ctx.beginPath();
        this.ctx.moveTo(object.p.x + this.position.x, object.p.y + this.position.y);
        this.ctx.lineTo(waypoint.p.x + this.position.x, waypoint.p.y + this.position.y);
        this.ctx.stroke();
      }

    });

    // Draw Features
    this.features.forEach((object: Feature, index) => {
      if (object.waypoint) {
        this.ctx.beginPath();
        this.ctx.moveTo(object.waypoint.p.x + this.position.x, object.waypoint.p.y + this.position.y);
        this.ctx.lineTo(object.points[0].x + this.position.x, object.points[0].y + this.position.y);
        this.ctx.stroke();
      }

      let color1 = '';
      let color2 = '';

      switch (+object.detailLevel) {
        case DetailLevel.LOW:
          color1 = 'yellow';
          color2 = 'rgba(255, 255, 0, 0.2)';
          break;
        case DetailLevel.MEDIUM:
          color1 = 'rgba(255, 87, 51, 1.0)';
          color2 = 'rgba(255, 87, 51, 0.2)';
          break;
        case DetailLevel.HIGH:
          color1 = 'red';
          color2 = 'rgba(255, 0, 0, 0.2)';
          break;
        default:
          console.log(object.detailLevel);
          console.log('error')
      }


      this.ctx.fillStyle = color2;
      object.path = this.createPath(object.points);
      this.ctx.fill(object.path);

      this.ctx.fillStyle = color1;
      for (let point of object.points) {
        this.ctx.fillRect(point.x + (this.position.x / this.scaleTotal) - (point.width / 2), point.y + (this.position.y / this.scaleTotal) - (point.height / 2), point.width, point.height);
      }
      // this.ctx.fillRect(object.p1.x + (this.position.x / this.scaleTotal), object.p1.y + (this.position.y / this.scaleTotal), object.p2.x - object.p1.x, object.p2.y - object.p1.y);
    });
  }

  drawZoom() {
    // let matrix = this.ctx.getTransform();
    // let point: { x: number, y: number } = {
    //   x: matrix.a * this.mousePosition.x + matrix.c * this.mousePosition.y + matrix.e,
    //   y: matrix.b * this.mousePosition.x + matrix.d * this.mousePosition.y + matrix.f,
    // };

    // this.ctx.translate(this.mousePosition.x, this.mousePosition.y);
    // this.ctx.scale(this.scale, this.scale);
    // this.ctx.translate(-this.mousePosition.x, -this.mousePosition.y);
    // console.log(this.mousePosition);
    // this.draw();
  }

  createPath(points: Point[]): Path2D {
    let path = new Path2D();
    path.moveTo(points[0].x + (this.position.x / this.scaleTotal), points[0].y + (this.position.y / this.scaleTotal));
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x + (this.position.x / this.scaleTotal), points[i].y + (this.position.y / this.scaleTotal));
    }
    path.closePath();
    return path;
  }


  createObject(event: MouseEvent) {
    if (this.stateControl.addToolSelected == AddTool.WAYPOINT && event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      let found = false;

      for (let waypoint of this.waypoints) {
        if (this.checkWaypointBounds(event, waypoint.p)) {
          found = true;
          if (this.selected == waypoint.p) {
            this.selected = undefined
          } else {
            this.selected = waypoint.p;
            this.stateControl.showEditWaypoint.next(waypoint);
          }
        }
      }

      if (!found) {
        this.waypoints.push({
          name: 'Waypoint' + event.offsetX + event.offsetY,
          p: {
            x: event.offsetX - this.position.x,
            y: event.offsetY - this.position.y,
            width: 10,
            height: 10
          },
          connections: [],
          navigatable: false,
          door: undefined
        });
        this.stateControl.showEditWaypoint.next(this.waypoints[this.waypoints.length - 1]);
      }
    } else if (this.stateControl.addToolSelected == AddTool.FEATURE) {
      if (Math.abs(event.offsetX - this.mouseClick.offsetX) < 5 && Math.abs(event.offsetY - this.mouseClick.offsetY) < 5) {
        this.features.push({
          name: 'DOOR' + event.offsetX + event.offsetY,
          description: 'PLACEHOLDER',
          points: [{
            x: event.offsetX - this.position.x,
            y: event.offsetY - this.position.y,
            width: 10,
            height: 10
          }],
          detailLevel: DetailLevel.LOW,
          path: undefined
        });

      } else {
        // Draw rectangle
        let p1: Point = {
          x: this.mouseClick.offsetX - this.position.x,
          y: this.mouseClick.offsetY - this.position.y,
          width: 10,
          height: 10
        }
        let p2: Point = {
          x: this.mouseClick.offsetX - this.position.x,
          y: event.offsetY - this.position.y,
          width: 10,
          height: 10
        }
        let p3: Point = {
          x: event.offsetX - this.position.x,
          y: event.offsetY - this.position.y,
          width: 10,
          height: 10
        }
        let p4: Point = {
          x: event.offsetX - this.position.x,
          y: this.mouseClick.offsetY - this.position.y,
          width: 10,
          height: 10
        }

        this.features.push({
          name: 'Feature' + event.offsetX + event.offsetY,
          description: 'PLACEHOLDER',
          points: [p1, p2, p3, p4],
          path: new Path2D(),
          detailLevel: DetailLevel.LOW
        });
      }
      this.stateControl.showEditFeature.next(this.features[this.features.length - 1]);
    }
  }

  selectObject(event: MouseEvent) {

    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      this.features.forEach((object, index) => {
        let [found, p] = this.checkFeatureBounds(event, object);
        if (found) {
          this.selected = p;
          this.stateControl.showEditFeature.next(object);
        }
      });
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          this.selected = object.p;
          this.stateControl.showEditWaypoint.next(object);
        }
      });
    }

  }

  removeObject(event: MouseEvent) {
    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {

          for (let waypoint of object.connections) {
            let i = waypoint.connections.indexOf(object);
            waypoint.connections.splice(i, 1);
          }
          this.waypoints.splice(index, 1);
          this.selected = undefined;
        }
      });
      this.features.forEach((object, index) => {
        if (true == this.checkFeatureBounds(event, object)[0]) {
          this.features.splice(index, 1);
        }
      });
    }
  }

  connectObject(event: MouseEvent) {
    if (this.connectP1 == -1) {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          this.connectP1 = index;
        }
      });
    } else {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          if (this.connectP1 == index) {
            this.connectP1 = -1;
          } else if (this.waypoints[this.connectP1].connections.includes(this.waypoints[index])) {
            let i = this.waypoints[this.connectP1].connections.indexOf(this.waypoints[index]);
            this.waypoints[this.connectP1].connections.splice(i, 1);
            i = this.waypoints[index].connections.indexOf(this.waypoints[this.connectP1]);
            this.waypoints[index].connections.splice(i, 1);
            this.connectP1 = -1;
          } else {
            this.waypoints[this.connectP1].connections.push(this.waypoints[index]);
            this.waypoints[index].connections.push(this.waypoints[this.connectP1]);
            this.connectP1 = -1;
            console.log("code executed")
          }
        }
      });
      this.features.forEach((object, index) => {
        if (object.points.length == 1 && this.checkFeatureBounds(event, object)[0]) {
          if (object.waypoint == this.waypoints[this.connectP1]) {
            object.waypoint = undefined;
            this.connectP1 = -1;
          } else {
            object.waypoint = this.waypoints[this.connectP1];
            this.connectP1 = -1;
          }
        }
      }
      );
    }
  }

  checkWaypointBounds(event: MouseEvent, object: Point): boolean {
    return event.offsetX - this.position.x > object.x - object.width / 2 && event.offsetX - this.position.x < object.x + object.width - object.width / 2 &&
      event.offsetY - this.position.y > object.y - object.height / 2 && event.offsetY - this.position.y < object.y + object.height - object.height / 2;
  }

  checkFeatureBounds(event: MouseEvent, object: Feature): [boolean, Point | undefined] {
    for (let point of object.points) {
      if (this.checkWaypointBounds(event, point)) {
        return [true, point];
      }
    }
    if (object.path == undefined) {
      return [false, undefined];
    }
    return [this.ctx.isPointInPath(object.path, event.offsetX, event.offsetY), undefined];
  }

}