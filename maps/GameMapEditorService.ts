import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
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

    updateGhostObjects(): void {
        this.ghostObjects = [];

        if (!this.enabled
            || this.selectedType === GameObjectType.NONE
            || this.gridSize === 0
            || this.hoverPosition === undefined
            || this.viewPosition === undefined) {
            return;
        }

        const properties = GameObjectProperties.getTypeProperties(this.selectedType);
        const snappedPosition = this.getSnappedRelativePosition(this.hoverPosition);
        if (snappedPosition === undefined) {
            return;
        }

        for (let y = 0; y < this.gridSize; y += properties.height) {
            for (let x = 0; x < this.gridSize; x += properties.width) {
                this.ghostObjects.push(
                    this.gameObjectFactory.buildFromOptions({
                        type: this.selectedType,
                        position: {
                            x: x + snappedPosition.x,
                            y: y + snappedPosition.y,
                        },
                    }),
                );
            }
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    setGridSize(gridSize: number): void {
        this.gridSize = gridSize;
    }

    setSelectedObjectType(type: GameObjectType): void {
        this.selectedType = type;
    }

    setHoverPosition(position: Point): void {
        this.hoverPosition = position;
    }

    setViewPosition(position: Point): void {
        this.viewPosition = position;
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

        return {
            tl: snappedPosition,
            br: {
                x: snappedPosition.x + this.gridSize,
                y: snappedPosition.y + this.gridSize,
            },
        };
    }

    getGhostObjects(): GameObject[] {
        return this.ghostObjects;
    }
}
