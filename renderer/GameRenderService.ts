import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';

export default class GameRenderService {
    private gameToRenderSizeScale;
    private renderWidth;
    private renderHeight;
    private gameWidth;
    private gameHeight;
    context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, targetGameSize: number) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        this.context = context;

        this.renderWidth = canvas.width = window.innerWidth;
        this.renderHeight = canvas.height = window.innerHeight;

        const minRenderSize = Math.min(this.renderWidth, this.renderHeight);
        this.gameToRenderSizeScale = minRenderSize / targetGameSize;
        this.gameWidth = this.renderWidth / this.gameToRenderSizeScale;
        this.gameHeight = this.renderHeight / this.gameToRenderSizeScale;
    }

    renderObjects(objects: GameObject[], point: Point): void {
        for (const object of objects) {
            const sprite = object.sprite;
            if (sprite === undefined) {
                continue;
            }

            if (!sprite.image) {
                sprite.image = new Image();
                sprite.image.src = `${CLIENT_SPRITES_RELATIVE_URL}/sprite.filename`;
            }

            if (!sprite.image.complete) {
                continue;
            }

            const objectGameRelativeX = object.position.x - point.x;
            const objectGameRelativeY = object.position.y - point.y;
            const objectRenderX = (object.position.x - objectGameRelativeX) * this.gameToRenderSizeScale;
            const objectRenderY = (object.position.y - objectGameRelativeY) * this.gameToRenderSizeScale;
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
