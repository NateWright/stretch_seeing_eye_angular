import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { StateControlService, tool, DetailLevel, AddTool } from '../state-control.service';
import { Subscription } from 'rxjs';
import { Waypoint } from '../shared/Waypoint';
import { Point } from '../shared/BaseObject';
import { Door } from '../shared/Door';

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
  press = false;
  mouseDownOnWaypoint = false;
  mouseClick!: MouseEvent;

  selectedId = -1;
  selected: Point | undefined = undefined;
  selectedWaypoint: Waypoint | undefined = undefined;
  connectP1: number = -1;
  connectP2: number = -1;

  constructor(public stateControl: StateControlService) {
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

  onMouseMove(event: MouseEvent) {
    if (this.stateControl.toolSelected == tool.PAN && this.press) {
      this.position.x += event.movementX;
      this.position.y += event.movementY;
      this.draw();
    }
    if (this.stateControl.toolSelected == tool.SELECT) {
      if (this.press && this.selected) {
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
    this.ctx.drawImage(this.mapImage, this.position.x, this.position.y);

    // Draw Waypoints
    for (let w of this.stateControl.waypoints.values()) {
      w.draw(this.ctx, this.position.x, this.position.y, this.selectedId);
    }
    for (let d of this.stateControl.doors.values()) {
      d.draw(this.ctx, this.position.x, this.position.y, this.selectedId);
    }
  }

  createPath(points: Point[]): Path2D {
    let path = new Path2D();
    path.moveTo(points[0].x + (this.position.x), points[0].y + (this.position.y));
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x + (this.position.x), points[i].y + (this.position.y));
    }
    path.closePath();
    return path;
  }


  createObject(event: MouseEvent) {
    if (this.stateControl.addToolSelected === AddTool.WAYPOINT) {
      const waypoints = this.stateControl.waypoints;
      const id = this.stateControl.idCounter;
      this.stateControl.idCounter++;

      waypoints.set(id, new Waypoint(id, 'Waypoint' + event.offsetX + event.offsetY, { x: event.offsetX - this.position.x, y: event.offsetY - this.position.y }));
      this.selectedId = id;
      this.selected = waypoints.get(id)!.point;
      this.stateControl.showEdit.next(waypoints.get(id));
    } else if (this.stateControl.addToolSelected == AddTool.FEATURE) {
      //   if (Math.abs(event.offsetX - this.mouseClick.offsetX) < 5 && Math.abs(event.offsetY - this.mouseClick.offsetY) < 5) {
      //     this.features.push({
      //       name: 'DOOR' + event.offsetX + event.offsetY,
      //       description: 'PLACEHOLDER',
      //       points: [{
      //         x: event.offsetX - this.position.x,
      //         y: event.offsetY - this.position.y,
      //         width: 10,
      //         height: 10
      //       }],
      //       detailLevel: DetailLevel.LOW,
      //       path: undefined
      //     });

      //   } else {
      //     // Draw rectangle
      //     let p1: Point = {
      //       x: this.mouseClick.offsetX - this.position.x,
      //       y: this.mouseClick.offsetY - this.position.y,
      //       width: 10,
      //       height: 10
      //     }
      //     let p2: Point = {
      //       x: this.mouseClick.offsetX - this.position.x,
      //       y: event.offsetY - this.position.y,
      //       width: 10,
      //       height: 10
      //     }
      //     let p3: Point = {
      //       x: event.offsetX - this.position.x,
      //       y: event.offsetY - this.position.y,
      //       width: 10,
      //       height: 10
      //     }
      //     let p4: Point = {
      //       x: event.offsetX - this.position.x,
      //       y: this.mouseClick.offsetY - this.position.y,
      //       width: 10,
      //       height: 10
      //     }

      //     this.features.push({
      //       name: 'Feature' + event.offsetX + event.offsetY,
      //       description: 'PLACEHOLDER',
      //       points: [p1, p2, p3, p4],
      //       path: new Path2D(),
      //       detailLevel: DetailLevel.LOW
      //     });
      //   }
      //   this.stateControl.showEditFeature.next(this.features[this.features.length - 1]);
    } else if (this.stateControl.addToolSelected == AddTool.DOOR) {
      const doors = this.stateControl.doors;
      const id = this.stateControl.idCounter;
      this.stateControl.idCounter++;
      doors.set(id, new Door(id, 'Door' + event.offsetX + event.offsetY, 'PLACEHOLDER', { x: event.offsetX - this.position.x, y: event.offsetY - this.position.y }, DetailLevel.HIGH));
      this.selectedId = id;
      this.selected = doors.get(id)!.entrancePoint;
      this.stateControl.showEdit.next(doors.get(id));
    }
  }

  selectObject(event: MouseEvent) {

    // this.features.forEach((object, index) => {
    //   let [found, p] = this.checkFeatureBounds(event, object);
    //   if (found) {
    //     this.selected = p;
    //     this.stateControl.showEditFeature.next(object);
    //   }
    // });
    const waypoints = this.stateControl.waypoints;
    for (let w of waypoints.values()) {
      let p = w.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        this.selected = p;
        this.selectedId = w.id;
        this.stateControl.showEdit.next(w);
        return;
      }
    }
    const doors = this.stateControl.doors;
    for (let d of doors.values()) {
      let p = d.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        this.selected = p;
        this.selectedId = d.id;
        this.stateControl.showEdit.next(d);
        return;
      }
    }
    this.selected = undefined;
    this.selectedId = -1;
    this.stateControl.showEdit.next(undefined);
    this.draw();

  }

  removeObject(event: MouseEvent) {
    const waypoints = this.stateControl.waypoints;
    for (let w of waypoints.values()) {
      let p = w.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        for (let w2 of waypoints.values()) {
          w2.connections.splice(w2.connections.indexOf(w), 1);
        }
        waypoints.delete(w.id);
        this.selected = undefined;
        this.selectedId = -1;
        this.stateControl.showEdit.next(undefined);
        this.draw();
        return;
      }
    }
    const doors = this.stateControl.doors;
    for (let d of doors.values()) {
      let p = d.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        doors.delete(d.id);
        this.selected = undefined;
        this.selectedId = -1;
        this.stateControl.showEdit.next(undefined);
        this.draw();
        return;
      }
    }
  }

  connectObject(event: MouseEvent) {
    if (this.selectedId == -1) {
      this.selectObject(event);
      console.log(this.selectedId);
      return;
    }
    const waypoints = this.stateControl.waypoints;
    const doors = this.stateControl.doors;
    for (let [n, w] of waypoints.entries()) {
      if (n === this.selectedId) {
        continue;
      }
      let p = w.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        if (waypoints.has(this.selectedId)) {
          let w1 = waypoints.get(this.selectedId)!;
          if (!w1.connections.includes(w)) {
            w1.connections.push(w);
            w.connections.push(w1);
          }
        } else if (doors.has(this.selectedId)) {
          let d1 = doors.get(this.selectedId)!;
          if (!w.doors.includes(d1)) {
            w.doors.push(d1);
          }
        }
        this.selectedId = -1;
        this.selected = undefined;
        this.draw();
        return;
      }
    }
    for (let d of doors.values()) {
      let p = d.checkBounds({ x: event.offsetX - this.position.x, y: event.offsetY - this.position.y });
      if (p !== undefined) {
        if (waypoints.has(this.selectedId)) {
          let w1 = waypoints.get(this.selectedId)!;
          if (!w1.doors.includes(d)) {
            w1.doors.push(d);
          }
        }
        this.selectedId = -1;
        this.selected = undefined;
        this.draw();
        return;
      }
    }

  }

}