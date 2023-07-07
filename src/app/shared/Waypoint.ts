import { DetailLevel } from "../state-control.service";
import { BaseObject, Point } from "./BaseObject";
import { Door } from "./Door";

export class Waypoint extends BaseObject {
    point: Point;
    connections: Waypoint[] = [];
    doors: Door[] = [];
    navigatable: boolean = false;
    detailLevel?: DetailLevel;
    constructor(id: number, name: string, point: Point) {
        super(id, name, 10, 10);
        this.point = point;
    }
    checkBounds(point: Point): Point | undefined {
        if (this.point.x - this.width / 2 <= point.x && point.x <= this.point.x + this.width / 2
            && this.point.y - this.height / 2 <= point.y && point.y <= this.point.y + this.height / 2) {
            return this.point;
        }
        return undefined;
    }
    draw(ctx: CanvasRenderingContext2D, positionX: number, positionY: number, selected: number) {
        ctx.fillStyle = "black";
        for (let c of this.connections) {
            ctx.beginPath();
            ctx.moveTo(positionX + this.point.x, positionY + this.point.y);
            ctx.lineTo(positionX + c.point.x, positionY + c.point.y);
            ctx.stroke();
        }
        for (let d of this.doors) {
            ctx.beginPath();
            ctx.moveTo(positionX + this.point.x, positionY + this.point.y);
            ctx.lineTo(positionX + d.entrancePoint.x, positionY + d.entrancePoint.y);
            ctx.stroke();
        }
        if (selected == this.id) {
            ctx.fillStyle = "green";
        }
        ctx.fillRect(positionX + this.point.x - this.width / 2, positionY + this.point.y - this.height / 2, this.width, this.height);
    }
    export(resolution: number, originX: number, originY: number): string {
        let output = [];
        output.push("Waypoint");
        output.push(this.id);
        output.push(this.name);
        output.push(this.point.x * resolution + originX);
        output.push(this.point.y * resolution + originY);
        output.push(this.connections.length);
        output.push(...this.connections.map(c => c.id));
        output.push(this.doors.length);
        output.push(...this.doors.map(d => d.id));
        output.push(this.navigatable);
        if (this.navigatable && this.detailLevel) {
            output.push(DetailLevel[this.detailLevel]);
        }
        return output.join(",");
    }
    import(str: string, waypoints: Map<number, Waypoint>, doors: Map<number, Door>, resolution: number, originX: number, originY: number): void {
        let data = str.split(',').map(x => x.trim());
        let index = 1;
        this.id = +data[index++];
        this.name = data[index++];
        this.point = {
            x: (parseFloat(data[index++]) - originX) / resolution,
            y: (parseFloat(data[index++]) - originY) / resolution,
        };
        let count = +data[index++];
        for (let i = 0; i < count; i++) {
            let id = +data[index++];

            let waypoint = waypoints.get(id);
            if (waypoint) {
                this.connections.push(waypoint);
                waypoint.connections.push(this);
            }
        }
        count = +data[index++];
        for (let i = 0; i < count; i++) {
            let id = +data[index++];

            let door = doors.get(id);
            if (door) {
                this.doors.push(door);
            }
        }
        this.navigatable = data[index++] == 'true';
        if (this.navigatable) {
            this.detailLevel = data[index] == 'LOW' ? DetailLevel.LOW : data[index] == 'MEDIUM' ? DetailLevel.MEDIUM : DetailLevel.HIGH;
            index++;
        }
        console.log(this);
    }

}