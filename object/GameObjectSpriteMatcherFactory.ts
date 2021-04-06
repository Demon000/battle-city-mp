import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import ExplosionSpriteMatcher from '../explosion/ExplosionSpriteMatcher';
import GameObjectSpriteMatcher from './GameObjectSpriteMatcher';
import { TankSpriteMatcher } from '../tank/TankSpriteMatcher';

export default class GameObjectSpriteMatcherFactory {
    static buildFromObject(object: GameObject): GameObjectSpriteMatcher {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankSpriteMatcher(object);
            case GameObjectType.EXPLOSION:
                return new ExplosionSpriteMatcher(object);
            default:
                return new GameObjectSpriteMatcher(object);
        }
    }
}
