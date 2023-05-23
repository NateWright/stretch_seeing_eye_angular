import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { StateControlService, Feature, Point, tool, Waypoint } from '../state-control.service';
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
  mouseClick!: MouseEvent;
  waypoints: Waypoint[] = [];
  features: Feature[] = [];

  selected: number = -1;

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
    if (event.deltaY < 0) {
      this.scale = 1.1;
      this.scaleTotal *= 1.1;
    } else {
      this.scale = 0.9;
      this.scaleTotal *= 0.9;
    }
    this.drawZoom();
  }

  onMouseMove(event: MouseEvent) {
    if (this.stateControl.toolSelected == tool.PAN && this.press) {
      this.position.x += event.movementX;
      this.position.y += event.movementY;
      this.draw();
    }
    if (this.stateControl.toolSelected == tool.SELECT) {
      if (this.selected != -1 && this.press) {
        this.waypoints[this.selected].p.x += event.movementX;
        this.waypoints[this.selected].p.y += event.movementY;
        this.draw();
      }
    }
    this.mousePosition.x = event.offsetX;
    this.mousePosition.y = event.offsetY;
  }

  onMouseDown(event: MouseEvent) {
    this.press = true;
    this.mouseClick = event;
  }
  onMouseUp(event: MouseEvent) {
    this.press = false;

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
      if (index === this.selected) {
        this.ctx.fillStyle = 'red';
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
    this.features.forEach((object, index) => {
      let pointWidth = 10;
      this.ctx.fillStyle = 'blue';
      let moveTo = false;
      this.ctx.beginPath();
      for (let point of object.points) {
        if (!moveTo) {
          this.ctx.moveTo(point.x + (this.position.x / this.scaleTotal), point.y + (this.position.y / this.scaleTotal));
          moveTo = true;
        }
        else {
          this.ctx.lineTo(point.x + (this.position.x / this.scaleTotal), point.y + (this.position.y / this.scaleTotal));
          this.ctx.stroke();
        }
        this.ctx.fillRect(point.x + (this.position.x / this.scaleTotal) - (pointWidth / 2), point.y + (this.position.y / this.scaleTotal) - (pointWidth / 2), pointWidth, pointWidth);
      }
      this.ctx.lineTo(object.points[0].x + (this.position.x / this.scaleTotal), object.points[0].y + (this.position.y / this.scaleTotal));
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
      this.ctx.fill();
      // this.ctx.fillRect(object.p1.x + (this.position.x / this.scaleTotal), object.p1.y + (this.position.y / this.scaleTotal), object.p2.x - object.p1.x, object.p2.y - object.p1.y);
    });
  }

  drawZoom() {
    // let matrix = this.ctx.getTransform();
    // let point: { x: number, y: number } = {
    //   x: matrix.a * this.mousePosition.x + matrix.c * this.mousePosition.y + matrix.e,
    //   y: matrix.b * this.mousePosition.x + matrix.d * this.mousePosition.y + matrix.f,
    // };

    this.ctx.translate(this.mousePosition.x, this.mousePosition.y);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-this.mousePosition.x, -this.mousePosition.y);
    console.log(this.mousePosition);
    this.draw();
  }


  createObject(event: MouseEvent) {
    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      let found = false;
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          found = true;
          if (this.selected == index) {
            this.selected = -1;
          } else {
            this.selected = index;
            this.stateControl.showEditWaypoint.next(object);
          }
        }
      });
      if (!found) {
        this.waypoints.push({
          name: 'Waypoint' + event.offsetX + event.offsetY,
          p: {
            x: event.offsetX - this.position.x,
            y: event.offsetY - this.position.y,
            width: 10,
            height: 10
          },
          connections: []
        });
        this.stateControl.showEditWaypoint.next(this.waypoints[this.waypoints.length - 1]);

      }
      this.selected = -1;
    }
    else {
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
        description: '',
        points: [p1, p2, p3, p4]
      });
      this.stateControl.showEditFeature.next(this.features[this.features.length - 1]);
    }
  }

  selectObject(event: MouseEvent) {

    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          this.selected = index;
          this.stateControl.showEditWaypoint.next(object);
        }
      });
      this.features.forEach((object, index) => {
        if (this.checkFeatureBounds(event, object)) {
          this.selected = -1;
          this.stateControl.showEditFeature.next(object);
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
          this.selected = -1;
        }
      });
      this.features.forEach((object, index) => {
        if (this.checkFeatureBounds(event, object)) {
          this.features.splice(index, 1);
        }
      });
    }
  }

  connectObject(event: MouseEvent) {
    if (this.selected == -1) {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          this.selected = index;
        }
      });
    } else {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object.p)) {
          if (this.selected != index && !this.waypoints[this.selected].connections.includes(this.waypoints[index])) {
            this.waypoints[this.selected].connections.push(this.waypoints[index]);
            this.waypoints[index].connections.push(this.waypoints[this.selected]);
            this.selected = -1;
            console.log("code executed")
          }
        }
      });
    }
  }

  checkWaypointBounds(event: MouseEvent, object: Point): boolean {
    return event.offsetX - this.position.x > object.x - object.width / 2 && event.offsetX - this.position.x < object.x + object.width - object.width / 2 &&
      event.offsetY - this.position.y > object.y - object.height / 2 && event.offsetY - this.position.y < object.y + object.height - object.height / 2;
  }

  checkFeatureBounds(event: MouseEvent, object: Feature): boolean {
    return event.offsetX - this.position.x > object.points[0].x && event.offsetX - this.position.x < object.points[2].x &&
      event.offsetY - this.position.y > object.points[0].y && event.offsetY - this.position.y < object.points[2].y;
  }

}