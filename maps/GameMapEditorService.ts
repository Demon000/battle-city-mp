import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';

export default class GameMapEditorService {
    private gridSize = 0;
    private selectedType = GameObjectType.NONE;
    private ghostObjects = new Array<GameObject>();

    private reloadGhostObjects(): void {
        if (this.selectedType === GameObjectType.NONE) {
            return;
        }

        const properties = GameObjectProperties.getTypeProperties(this.selectedType);
        this.ghostObjects.length = 0;

        for (let y = 0; y < this.gridSize; y += properties.height) {
            for (let x = 0; x < this.gridSize; x += properties.width) {
                const object = GameObjectFactory.buildFromType(this.selectedType, {
                    x,
                    y,
                });
                this.ghostObjects.push(object);
            }
        }
    }

    getGhostObjects(): GameObject[] {
        return this.ghostObjects;
    }

    setGridSize(gridSize: number): void {
        this.gridSize = gridSize;
        this.reloadGhostObjects();
    }

    getGridSize(): number {
        return this.gridSize;
    }

    setSelectedObjectType(type: GameObjectType): void {
        this.selectedType = type;
        this.reloadGhostObjects();
    }
}
