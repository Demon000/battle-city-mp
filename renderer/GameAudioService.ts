import { CLIENT_SOUNDS_RELATIVE_URL } from '@/config';
import { GameObject } from '@/object/GameObject';
import { GameObjectAudioRenderer } from '@/object/GameObjectAudioRenderer';
import { GameObjectAudioRendererFactory } from '@/object/GameObjectAudioRendererFactory';
import { AudioEffectLoadingState, AudioEffect } from '@/object/GameObjectProperties';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { CartesianUtils } from '@/utils/CartesianUtils';
import axios from 'axios';

export class GameAudioService {
    private rendererFactory;
    private context;
    private compressorNode;
    private finalNode;
    private objectsPlayingAudioEffects = new Set<GameObject>();
    private maxAudibleDistance = 1;

    constructor(
        rendererFactory: GameObjectAudioRendererFactory,
    ) {
        this.rendererFactory = rendererFactory;
        this.context = new AudioContext();
        this.compressorNode = new DynamicsCompressorNode(this.context);
        this.compressorNode.connect(this.context.destination);
        this.finalNode = this.compressorNode;

        if (this.context.listener.forwardX !== undefined) {
            this.context.listener.forwardX.value = -1;
            this.context.listener.forwardY.value = 0;
            this.context.listener.forwardZ.value = 0;
            this.context.listener.upX.value = 0;
            this.context.listener.upY.value = 1;
            this.context.listener.upZ.value = 0;
        } else {
            this.context.listener.setOrientation(-1, 0, 0, 0, 1, 0);
        }
    }

    setMaxAudibleDistance(maxAudibleDistance: number): void {
        this.maxAudibleDistance = maxAudibleDistance;
    }

    loadAudioEffectBuffer(audioEffect: AudioEffect): boolean {
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

    getOrCreateAudioRenderer(object: GameObject): GameObjectAudioRenderer {
        if (object.audioRenderer === undefined) {
            object.audioRenderer = this.rendererFactory.buildFromObject(
                object, this.context, this.finalNode, this.maxAudibleDistance);
        }

        return object.audioRenderer;
    }

    findAudioRenderer(object: GameObject): GameObjectAudioRenderer {
        return object.audioRenderer;
    }

    stopAudioPlayback(object: GameObject): void {
        const audioRenderer = this.findAudioRenderer(object);
        if (audioRenderer === undefined) {
            return;
        }

        audioRenderer.stop();
        this.objectsPlayingAudioEffects.delete(audioRenderer.object);
    }

    playObjectsAudioEffect(objects: Iterable<GameObject>, point: Point, box: BoundingBox): void {
        CartesianUtils.setCartesianPositions(this.context.listener, point);

        for (const object of this.objectsPlayingAudioEffects) {
            if (BoundingBoxUtils.overlaps(box, object.boundingBox)) {
                continue;
            }

            const audioRenderer = this.getOrCreateAudioRenderer(object);
            audioRenderer.stop();
            this.objectsPlayingAudioEffects.delete(object);
        }

        for (const object of objects) {
            const audioRenderer = this.getOrCreateAudioRenderer(object);
            const audioEffect = audioRenderer.update();
            if (audioEffect !== undefined && audioEffect !== null) {
                this.loadAudioEffectBuffer(audioEffect);
                audioRenderer.play();
                this.objectsPlayingAudioEffects.add(object);
            } else {
                audioRenderer.stop();
            }
        }
    }

    clear(): void {
        for (const object of this.objectsPlayingAudioEffects) {
            const audioRenderer = this.findAudioRenderer(object);
            if (audioRenderer === undefined) {
                return;
            }

            audioRenderer.stop();
        }
    }
}
