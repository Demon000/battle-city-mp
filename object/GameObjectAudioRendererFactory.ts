import { GameObjectType } from './GameObjectType';
import GameObject from './GameObject';
import GameObjectAudioRenderer from './GameObjectAudioRenderer';
import TankAudioRenderer from '@/tank/TankAudioRenderer';
import ExplosionAudioRenderer from '@/explosion/ExplosionAudioRenderer';

export default class GameObjectAudioRendererFactory {
    buildFromObject(
        object: GameObject,
        context: AudioContext,
        finalNode: AudioNode,
        maxAudibleDistance: number,
    ): GameObjectAudioRenderer {
        switch (object.type) {
            case GameObjectType.TANK:
                return new TankAudioRenderer(object, context, finalNode, maxAudibleDistance);
            case GameObjectType.EXPLOSION:
                return new ExplosionAudioRenderer(object, context, finalNode, maxAudibleDistance);
            default:
                return new GameObjectAudioRenderer(object, context, finalNode, maxAudibleDistance);
        }
    }
}
