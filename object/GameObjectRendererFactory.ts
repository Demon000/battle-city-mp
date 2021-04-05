import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionRenderer from '../explosion/ExplosionRenderer';
import GameObjectRenderer from './GameObjectRenderer';
import { TankRenderer } from '../tank/TankRenderer';

export default class GameObjectRendererFactory {
    static buildFromObject(object: GameObject): GameObjectRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankRenderer(object);
            case GameObjectType.EXPLOSION:
                return new ExplosionRenderer(object);
            default:
                return new GameObjectRenderer(object);
        }
    }
}
