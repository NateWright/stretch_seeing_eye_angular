import { DetailLevel } from "../state-control.service";
import { BaseObject, Point } from "./BaseObject";

export class Door extends BaseObject {
    description: string;
    detailLevel: DetailLevel;
    entrancePoint: Point;
    insidePoint?: Point;

    constructor(id: number, name: string, description: string, entrancePoint: Point, detailLevel: DetailLevel) {
        super(id, name, 10, 10);
        this.description = description;
        this.entrancePoint = entrancePoint;
        this.detailLevel = detailLevel;
    }
    checkBounds(point: Point): Point | undefined {
        if (this.entrancePoint.x - this.width / 2 <= point.x && point.x <= this.entrancePoint.x + this.width / 2
            && this.entrancePoint.y - this.height / 2 <= point.y && point.y <= this.entrancePoint.y + this.height / 2) {
            return this.entrancePoint;
        } else if (this.insidePoint && this.insidePoint.x - this.width / 2 <= point.x && point.x <= this.insidePoint.x + this.width / 2
            && this.insidePoint.y - this.height / 2 <= point.y && point.y <= this.insidePoint.y + this.height / 2) {
            return this.insidePoint;
        }
        return undefined;
    }
    draw(ctx: CanvasRenderingContext2D, positionX: number, positionY: number, selected: number) {
        let color = "black";
        switch (+this.detailLevel) {
            case DetailLevel.LOW:
                color = 'rgba(255, 255, 0, 1)';
                break;
            case DetailLevel.MEDIUM:
                color = 'rgba(255, 87, 51, 1)';
                break;
            case DetailLevel.HIGH:
                color = 'rgba(255, 0, 0, 1)';
                break;
            default:
                color = "black";
        }
        ctx.fillStyle = color;

        if (selected !== undefined && selected == this.id) {
            ctx.fillStyle = "green";
        } else {
            ctx.fillStyle = color;
        }
        if (this.insidePoint) {
            ctx.beginPath();
            ctx.moveTo(this.entrancePoint.x + positionX, this.entrancePoint.y + positionY);
            ctx.lineTo(this.insidePoint.x + positionX, this.insidePoint.y + positionY);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.insidePoint.x + positionX, this.insidePoint.y + positionY, 5, 0, 2 * Math.PI);
            ctx.fill();
            // ctx.fillRect(positionX + this.insidePoint.x - this.width / 2, positionY + this.insidePoint.y - this.height / 2, this.width, this.height);
        }
        ctx.fillRect(positionX + this.entrancePoint.x - this.width / 2, positionY + this.entrancePoint.y - this.height / 2, this.width, this.height);
    }
    export(resolution: number, originX: number, originY: number): string {
        let output = [];
        output.push("Door");
        output.push(this.id);
        output.push(this.name);
        output.push(this.description);
        output.push(DetailLevel[this.detailLevel]);
        output.push(this.entrancePoint.x * resolution + originX);
        output.push(this.entrancePoint.y * resolution + originY);
        if (this.insidePoint) {
            output.push('true');
            output.push(this.insidePoint.x * resolution + originX);
            output.push(this.insidePoint.y * resolution + originY);
        } else {
            output.push('false');
        }
        return output.join(",");
    }
    import(str: string, resolution: number, originX: number, originY: number): void {
        let data = str.split(',').map(x => x.trim());
        let index = 1;
        this.id = +data[index++];
        this.name = data[index++];
        this.description = data[index++];
        this.detailLevel = data[index] == 'LOW' ? DetailLevel.LOW : data[index] == 'MEDIUM' ? DetailLevel.MEDIUM : DetailLevel.HIGH;
        index++;
        this.entrancePoint = {
            x: (parseFloat(data[index++]) - originX) / resolution,
            y: (parseFloat(data[index++]) - originY) / resolution,
        };
        if (data[index++] == 'true') {
            this.insidePoint = {
                x: (parseFloat(data[index++]) - originX) / resolution,
                y: (parseFloat(data[index++]) - originY) / resolution,
            };
        } else {
            this.insidePoint = undefined;
        }
    }


}
