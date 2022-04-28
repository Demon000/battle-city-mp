import { GameObject } from './GameObject';
import { GameObjectAudioRenderer } from './GameObjectAudioRenderer';

export class GameObjectAudioRendererFactory {
    buildFromObject(
        object: GameObject,
        context: AudioContext,
        finalNode: AudioNode,
        maxAudibleDistance: number,
    ): GameObjectAudioRenderer {
        return new GameObjectAudioRenderer(object, context, finalNode, maxAudibleDistance);
    }
}
