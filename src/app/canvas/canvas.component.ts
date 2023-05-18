import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { StateControlService, feature, tool, waypoint } from '../state-control.service';
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
  press = false;
  mouseClick!: MouseEvent;
  waypoints: waypoint[] = [];
  features: feature[] = [];

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
    } else {
      this.scale = 0.9;
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
        this.waypoints[this.selected].x += event.movementX;
        this.waypoints[this.selected].y += event.movementY;
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

    this.ctx.drawImage(this.mapImage, this.position.x, this.position.y);

    this.waypoints.forEach((object, index) => {
      this.ctx.fillStyle = 'black';
      if (index === this.selected) {
        this.ctx.fillStyle = 'red';
      }
      this.ctx.fillRect(object.x + this.position.x - object.width / 2, object.y + this.position.y - object.height / 2, object.width, object.height);

      for (let waypoint of object.connections) {
        this.ctx.beginPath();
        this.ctx.moveTo(object.x + this.position.x, object.y + this.position.y);
        this.ctx.lineTo(waypoint.x + this.position.x, waypoint.y + this.position.y);
        this.ctx.stroke();
      }
    });

    this.features.forEach((object, index) => {
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
      this.ctx.fillRect(object.p1.x + this.position.x, object.p1.y + this.position.y, object.p2.x - object.p1.x, object.p2.y - object.p1.y);
    });
  }

  drawZoom() {
    // let matrix = this.ctx.getTransform();
    // let point: { x: number, y: number } = {
    //   x: matrix.a * this.mousePosition.x + matrix.c * this.mousePosition.y + matrix.e,
    //   y: matrix.b * this.mousePosition.x + matrix.d * this.mousePosition.y + matrix.f,
    // };
    // this.ctx.translate(point.x, point.y);
    // this.ctx.scale(this.scale, this.scale);
    // this.ctx.translate(-point.x, -point.y);
    // this.draw();
  }


  createObject(event: MouseEvent) {
    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      let found = false;
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object)) {
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
          width: 10,
          height: 10,
          x: event.offsetX - this.position.x,
          y: event.offsetY - this.position.y,
          connections: []
        });
        this.stateControl.showEditWaypoint.next(this.waypoints[this.waypoints.length - 1]);

      }
      this.selected = -1;
    }
    else {
      // Draw rectangle
      let p1: { x: number, y: number } = {
        x: this.mouseClick.offsetX - this.position.x,
        y: this.mouseClick.offsetY - this.position.y
      }
      let p2: { x: number, y: number } = {
        x: event.offsetX - this.position.x,
        y: event.offsetY - this.position.y
      }

      this.features.push({
        name: 'Feature' + event.offsetX + event.offsetY,
        description: '',
        p1: p1,
        p2: p2
      });
      this.stateControl.showEditFeature.next(this.features[this.features.length - 1]);
    }
  }

  selectObject(event: MouseEvent) {

    if (event.offsetX === this.mouseClick.offsetX && event.offsetY === this.mouseClick.offsetY) {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object)) {
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
        if (this.checkWaypointBounds(event, object)) {

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
        if (this.checkWaypointBounds(event, object)) {
          this.selected = index;
        }
      });
    } else {
      this.waypoints.forEach((object, index) => {
        if (this.checkWaypointBounds(event, object)) {
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

  checkWaypointBounds(event: MouseEvent, object: waypoint): boolean {
    return event.offsetX - this.position.x > object.x - object.width / 2 && event.offsetX - this.position.x < object.x + object.width - object.width / 2 &&
      event.offsetY - this.position.y > object.y - object.height / 2 && event.offsetY - this.position.y < object.y + object.height - object.height / 2;
  }

  checkFeatureBounds(event: MouseEvent, object: feature): boolean {
    return event.offsetX - this.position.x > object.p1.x && event.offsetX - this.position.x < object.p2.x &&
      event.offsetY - this.position.y > object.p1.y && event.offsetY - this.position.y < object.p2.y;
  }

}