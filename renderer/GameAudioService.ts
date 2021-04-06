import { CLIENT_CONFIG_VISIBLE_GAME_SIZE, CLIENT_SOUNDS_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import GameObjectAudioRenderer from '@/object/GameObjectAudioRenderer';
import GameObjectAudioRendererFactory from '@/object/GameObjectAudioRendererFactory';
import { AudioEffectLoadingState, IAudioEffect } from '@/object/IGameObjectProperties';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import BoundingBoxUtils from '@/physics/bounding-box/BoundingBoxUtils';
import Point from '@/physics/point/Point';
import CartesianUtils from '@/utils/CartesianUtils';
import MapRepository from '@/utils/MapRepository';
import axios from 'axios';

export default class GameAudioService {
    private context;
    private compressorNode;
    private finalNode;
    private objectAudioRendererRepository;
    private objectsPlayingAudioEffects = new Set<GameObject>();
    private maxAudibleDistance = CLIENT_CONFIG_VISIBLE_GAME_SIZE / 2;

    constructor(objectAudioRendererRepository: MapRepository<number, GameObjectAudioRenderer>) {
        this.objectAudioRendererRepository = objectAudioRendererRepository;
        this.context = new AudioContext();
        this.compressorNode = new DynamicsCompressorNode(this.context);
        this.compressorNode.connect(this.context.destination);
        this.finalNode = this.compressorNode;

        this.context.listener.forwardX.value = -1;
        this.context.listener.forwardY.value = 0;
        this.context.listener.forwardZ.value = 0;
    }

    loadAudioEffectBuffer(audioEffect: IAudioEffect): boolean {
        if (audioEffect.state === AudioEffectLoadingState.LOADED) {
            return true;
        }

        if (audioEffect.state === AudioEffectLoadingState.LOADING) {
            return false;
        }

        audioEffect.state = AudioEffectLoadingState.LOADING;
        axios.get(`${CLIENT_SOUNDS_RELATIVE_URL}/${audioEffect.filename}`, {
            responseType: 'arraybuffer',
        }).then(response => {
            return this.context.decodeAudioData(response.data);
        }).then(buffer => {
            audioEffect.buffer = buffer;
            audioEffect.state = AudioEffectLoadingState.LOADED;
        });

        return false;
    }

    getAudioRenderer(object: GameObject): GameObjectAudioRenderer {
        let audioRenderer = this.objectAudioRendererRepository.find(object.id);
        if (audioRenderer === undefined) {
            audioRenderer = GameObjectAudioRendererFactory.buildFromObject(
                object, this.context, this.finalNode, this.maxAudibleDistance);
            this.objectAudioRendererRepository.add(object.id, audioRenderer);
        }
    
        return audioRenderer;
    }

    playObjectsAudioEffect(objects: GameObject[], point: Point, box: BoundingBox): void {
        CartesianUtils.setCartesianPositions(this.context.listener, point);

        for (const object of this.objectsPlayingAudioEffects) {
            if (BoundingBoxUtils.overlaps(box, object.getBoundingBox())) {
                continue;
            }

            const audioRenderer = this.getAudioRenderer(object);
            audioRenderer.stopAudioEffect();
            this.objectsPlayingAudioEffects.delete(object);
        }

        for (const object of objects) {
            const audioRenderer = this.getAudioRenderer(object);
            const audioEffect = audioRenderer.updateAudioEffect();
            if (audioEffect !== undefined && audioEffect !== null) {
                this.loadAudioEffectBuffer(audioEffect);
                audioRenderer.updatePlayingAudioEffect();
                this.objectsPlayingAudioEffects.add(object);
            } else {
                audioRenderer.stopAudioEffect();
            }
        }
    }
}
