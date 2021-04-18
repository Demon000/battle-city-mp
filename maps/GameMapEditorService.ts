import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';

export default class GameMapEditorService {
    private enabled = false;
    private gridSize = 0;
    private selectedType = GameObjectType.NONE;
    private hoverPosition?: Point;
    private viewPosition?: Point;
    private ghostObjects = new Array<GameObject>();

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

        const worldX = this.viewPosition.x + this.hoverPosition.x;
        const worldY = this.viewPosition.y + this.hoverPosition.y;
        const snappedX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.floor(worldY / this.gridSize) * this.gridSize;

        for (let y = 0; y < this.gridSize; y += properties.height) {
            for (let x = 0; x < this.gridSize; x += properties.width) {
                this.ghostObjects.push(
                    GameObjectFactory.buildFromType(this.selectedType, {
                        x: x + snappedX,
                        y: y + snappedY,
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

    getDestroyBox(position: Point): BoundingBox {
        return {
            tl: position,
            br: {
                x: position.x + this.gridSize,
                y: position.y + this.gridSize,
            },
        };
    }

    getGhostObjects(): GameObject[] {
        return this.ghostObjects;
    }
}
