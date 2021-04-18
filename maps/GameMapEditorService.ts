import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import Point from '@/physics/point/Point';

export default class GameMapEditorService {
    private gridSize = 0;
    private selectedType = GameObjectType.NONE;
    private hoverPosition?: Point;

    getGhostObjects(viewX: number, viewY: number): GameObject[] {
        if (this.selectedType === GameObjectType.NONE
            || this.gridSize === 0
            || this.hoverPosition === undefined) {
            return [];
        }

        const ghostObjects = new Array<GameObject>();
        const properties = GameObjectProperties.getTypeProperties(this.selectedType);

        const worldX = viewX + this.hoverPosition.x;
        const worldY = viewY + this.hoverPosition.y;
        const snappedX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.floor(worldY / this.gridSize) * this.gridSize;

        for (let y = 0; y < this.gridSize; y += properties.height) {
            for (let x = 0; x < this.gridSize; x += properties.width) {
                const object = GameObjectFactory.buildFromType(this.selectedType, {
                    x: x + snappedX,
                    y: y + snappedY,
                });
                ghostObjects.push(object);
            }
        }

        return ghostObjects;
    }

    setGridSize(gridSize: number): void {
        this.gridSize = gridSize;
    }

    setSelectedObjectType(type: GameObjectType): void {
        this.selectedType = type;
    }

    setHoverPosition(hoverPosition: Point): void {
        this.hoverPosition = hoverPosition;
    }

    getGridSize(): number {
        return this.gridSize;
    }
}
