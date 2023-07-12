export interface Point {
    x: number;
    y: number;
}

export abstract class BaseObject {
    id: number;
    name: string;
    width: number;
    height: number;

    constructor(id: number, name: string, width: number, height: number) {
        this.id = id;
        this.name = name;
        this.width = width;
        this.height = height;
    }
    abstract checkBounds(point: Point): Point | undefined;
    abstract draw(ctx: CanvasRenderingContext2D, positionX: number, positionY: number, selected: number): void;
    abstract export(size: { width: number, height: number }, resolution: number, originX: number, originY: number): string;
}