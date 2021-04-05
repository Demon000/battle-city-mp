import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import { ISprite } from '@/object/IGameObjectProperties';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import MapRepository from '@/utils/MapRepository';
import GameObjectRenderer from '../object/GameObjectRenderer';
import GameObjectRendererFactory from '../object/GameObjectRendererFactory';

export default class GameRenderService {
    private gameToRenderSizeScale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private canvas;
    private targetGameSize;
    private context;
    private rendererRepository;

    constructor(
        rendererRepository: MapRepository<number, GameObjectRenderer>,
        canvas: HTMLCanvasElement,
        targetGameSize: number,
    ) {
        this.rendererRepository = rendererRepository;
        this.canvas = canvas;
        this.targetGameSize = targetGameSize;

        const context = canvas.getContext('2d', {
            alpha: false,
        });
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        this.context = context;

        this.calculateDimensions();
    }

    calculateDimensions(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const minRenderSize = Math.max(this.canvas.width, this.canvas.height);
        this.gameToRenderSizeScale = Math.ceil(minRenderSize / this.targetGameSize);
        this.gameWidth = this.canvas.width / this.gameToRenderSizeScale;
        this.gameWidth -= this.gameWidth % 2;
        this.gameHeight = this.canvas.height / this.gameToRenderSizeScale;
        this.gameHeight -= this.gameHeight % 2;
    }

    renderSprite(
        object: GameObject,
        sprite: ISprite,
        canvasX: number,
        canvasY: number,
    ): void {
        if (sprite.image === undefined) {
            sprite.image = new Image();
            sprite.image.src = `${CLIENT_SPRITES_RELATIVE_URL}/${sprite.filename}`;
        }

        if (!sprite.image.complete) {
            return;
        }

        let objectRelativeX = Math.floor(object.position.x) - canvasX;
        if (sprite.offset !== undefined) {
            objectRelativeX += sprite.offset.x;
        }

        let objectRelativeY = Math.floor(object.position.y) - canvasY;
        if (sprite.offset !== undefined) {
            objectRelativeY += sprite.offset.y;
        }

        let objectWidth;
        if (sprite.width === undefined) {
            objectWidth = object.properties.width;
        } else {
            objectWidth = sprite.width;
        }

        let objectHeight;
        if (sprite.height === undefined) {
            objectHeight = object.properties.height;
        } else {
            objectHeight = sprite.height;
        }

        const objectRenderX = objectRelativeX * this.gameToRenderSizeScale;
        const objectRenderY = objectRelativeY * this.gameToRenderSizeScale;
        const objectRenderWidth = objectWidth * this.gameToRenderSizeScale;
        const objectRenderHeight = objectHeight * this.gameToRenderSizeScale;

        if (sprite.canvas === undefined || sprite.canvas.width !== objectRenderWidth
            || sprite.canvas.height !== objectRenderHeight) {
            sprite.canvas = new OffscreenCanvas(objectRenderWidth, objectRenderHeight);
            const context = sprite.canvas.getContext('2d');
            if (context === null) {
                throw new Error('Failed to create offscreen canvas context');
            }
            context.imageSmoothingEnabled = false;
            context.drawImage(sprite.image, 0, 0, objectRenderWidth, objectRenderHeight);
            sprite.context = context;
        }

        this.context.drawImage(sprite.canvas, objectRenderX, objectRenderY);
    }

    getRenderer(object: GameObject): GameObjectRenderer {
        let renderer = this.rendererRepository.find(object.id);
        if (renderer === undefined) {
            renderer = GameObjectRendererFactory.buildFromObject(object);
            this.rendererRepository.add(object.id, renderer);
        }

        return renderer;
    }

    renderObjectsPass(objects: GameObject[], point: Point, pass: number): GameObject[] {
        const canvasX = point.x - this.gameWidth / 2;
        const canvasY = point.y - this.gameHeight / 2;

        const leftoverObjects = new Array<GameObject>();
        for (const object of objects) {
            const renderer = this.getRenderer(object);
            const sprites = renderer.sprites;
            if (sprites === undefined) {
                continue;
            }

            let hasLeftoverSprites = false;
            for (const sprite of sprites) {
                if ((sprite.renderPass === undefined && pass !== 0)
                    || (sprite.renderPass !== undefined && sprite.renderPass !== pass)) {
                    hasLeftoverSprites = true;
                    continue;
                }

                this.renderSprite(object, sprite, canvasX, canvasY);
            }

            if (hasLeftoverSprites) {
                leftoverObjects.push(object);
            }
        }

        return leftoverObjects;
    }

    renderObjects(objects: GameObject[], point: Point): void {
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let renderSprites = objects;
        let pass = 0;
        while (renderSprites.length) {
            renderSprites = this.renderObjectsPass(renderSprites, point, pass);
            pass++;
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
