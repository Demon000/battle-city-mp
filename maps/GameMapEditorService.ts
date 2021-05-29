import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import BoundingBoxUtils from '@/physics/bounding-box/BoundingBoxUtils';
import Point from '@/physics/point/Point';

export default class GameMapEditorService {
    private gameObjectFactory;
    private enabled = false;
    private gridSize = 0;
    private selectedType = GameObjectType.NONE;
    private hoverPosition?: Point;
    private viewPosition?: Point;
    private ghostObjects = new Array<GameObject>();

    constructor(gameObjectFactory: GameObjectFactory) {
        this.gameObjectFactory = gameObjectFactory;
    }

    getSnappedRelativePosition(position: Point): Point | undefined {
        if (this.viewPosition === undefined) {
            return undefined;
        }

        const worldX = this.viewPosition.x + position.x;
        const worldY = this.viewPosition.y + position.y;
        const snappedX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.floor(worldY / this.gridSize) * this.gridSize;

        return {
            x: snappedX,
            y: snappedY,
        };
    }

    updateGhostObjects(positionsOnly = false): void {
        if (!positionsOnly) {
            this.ghostObjects = [];
        }

        if (!this.enabled
            || this.selectedType === GameObjectType.NONE
            || this.gridSize === 0
            || this.hoverPosition === undefined
            || this.viewPosition === undefined) {
            return;
        }

        const snappedPosition = this.getSnappedRelativePosition(this.hoverPosition);
        if (snappedPosition === undefined) {
            return;
        }

        let object;
        for (let y = 0; y < this.gridSize;) {
            for (let x = 0; x < this.gridSize;) {
                if (positionsOnly) {
                    const i = y * this.gridSize + x;
                    object = this.ghostObjects[i];
                    object.position = {
                        x: snappedPosition.x + x,
                        y: snappedPosition.y + y,
                    };
                } else {
                    object = this.gameObjectFactory.buildFromOptions({
                        type: this.selectedType,
                        position: {
                            x: snappedPosition.x + x,
                            y: snappedPosition.y + y,
                        },
                    });
                }

                x += object.width;

                if (!positionsOnly) {
                    this.ghostObjects.push(object);
                }
            }

            if (object === undefined) {
                return;
            }

            y += object.height;
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.updateGhostObjects();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setGridSize(gridSize: number): void {
        this.gridSize = gridSize;
        this.updateGhostObjects();
    }

    setSelectedObjectType(type: GameObjectType): void {
        this.selectedType = type;
        this.updateGhostObjects();
    }

    setHoverPosition(position: Point): void {
        if (!this.enabled) {
            return;
        }

        this.hoverPosition = position;
        this.updateGhostObjects(true);
    }

    setViewPosition(position: Point): void {
        if (!this.enabled) {
            return;
        }

        this.viewPosition = position;
        this.updateGhostObjects(true);
    }

    getGridSize(): number {
        if (!this.enabled || this.gridSize === 1) {
            return 0;
        }

        return this.gridSize;
    }

    getDestroyBox(position: Point): BoundingBox | undefined {
        const snappedPosition = this.getSnappedRelativePosition(position);
        if (snappedPosition === undefined) {
            return undefined;
        }

        return BoundingBoxUtils.create(snappedPosition.x, snappedPosition.y,
            snappedPosition.x + this.gridSize, snappedPosition.y + this.gridSize);
    }

    getGhostObjects(): GameObject[] {
        return this.ghostObjects;
    }
}
