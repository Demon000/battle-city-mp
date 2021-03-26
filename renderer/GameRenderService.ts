import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';

export default class GameRenderService {
    private gameToRenderSizeScale;
    private renderWidth;
    private renderHeight;
    private gameWidth;
    private gameHeight;
    private watchedObject: GameObject | undefined;
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

    renderObjects(objects: GameObject[]): void {
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

            const objectGameRelativeX = object.position.x - (this.watchedObject?.position.x ?? 0);
            const objectGameRelativeY = object.position.y - (this.watchedObject?.position.y ?? 0);
            const objectRenderX = (object.position.x - objectGameRelativeX) * this.gameToRenderSizeScale;
            const objectRenderY = (object.position.y - objectGameRelativeY) * this.gameToRenderSizeScale;
            const objectRenderWidth = object.properties.width * this.gameToRenderSizeScale;
            const objectRenderHeight = object.properties.height * this.gameToRenderSizeScale;

            this.context.drawImage(sprite.image, objectRenderX, objectRenderY, objectRenderWidth, objectRenderHeight);
        }
    }

    setWatchedObject(object: GameObject | undefined): void {
        this.watchedObject = object;
    }

    getViewableMapBoundingBox(): BoundingBox | undefined {
        if (this.watchedObject === undefined) {
            return undefined;
        }

        return {
            tl: {
                x: this.watchedObject.position.x - this.gameWidth / 2,
                y: this.watchedObject.position.y - this.gameHeight / 2,
            },
            br: {
                x: this.watchedObject.position.x + this.gameWidth / 2,
                y: this.watchedObject.position.y + this.gameHeight / 2,
            },
        };
    }
}
