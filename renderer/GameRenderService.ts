import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';

export default class GameRenderService {
    private targetGameSize = 0;
    private gameToRenderSizeScale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, targetGameSize: number) {
        this.canvas = canvas;
        this.targetGameSize = targetGameSize;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        this.context = context;

        this.calculateDimensions();
    }

    calculateDimensions(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const minRenderSize = Math.min(this.canvas.width, this.canvas.height);
        this.gameToRenderSizeScale = minRenderSize / this.targetGameSize;
        this.gameWidth = this.canvas.width / this.gameToRenderSizeScale;
        this.gameHeight = this.canvas.height / this.gameToRenderSizeScale;
    }

    renderObjects(objects: GameObject[], point: Point): void {
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let minObjectX = 10000;
        let minObjectY = 10000;

        const canvasX = point.x - this.gameWidth / 2;
        const canvasY = point.y - this.gameHeight / 2;

        for (const object of objects) {
            const sprite = object.sprite;
            if (sprite === undefined) {
                continue;
            }

            if (!sprite.image) {
                sprite.image = new Image();
                sprite.image.src = `${CLIENT_SPRITES_RELATIVE_URL}/${sprite.filename}`;
            }

            if (!sprite.image.complete) {
                continue;
            }

            const objectGameRelativeX = object.position.x - canvasX;
            const objectGameRelativeY = object.position.y - canvasY;

            if (object.position.x < minObjectX) {
                minObjectX = object.position.x;
            }

            if (object.position.y < minObjectY) {
                minObjectY = object.position.y;
            }

            const objectRenderX = objectGameRelativeX * this.gameToRenderSizeScale;
            const objectRenderY = objectGameRelativeY * this.gameToRenderSizeScale;
            const objectRenderWidth = object.properties.width * this.gameToRenderSizeScale;
            const objectRenderHeight = object.properties.height * this.gameToRenderSizeScale;

            this.context.drawImage(sprite.image, objectRenderX, objectRenderY, objectRenderWidth, objectRenderHeight);
        }
    }

    getViewableMapBoundingBox(position: Point): BoundingBox | undefined {
        return {
            tl: {
                x: position.x - this.gameWidth / 2,
                y: position.y - this.gameHeight / 2,
            },
            br: {
                x: position.x + this.gameWidth / 2,
                y: position.y + this.gameHeight / 2,
            },
        };
    }
}
