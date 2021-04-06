import CartesianUtils from '@/utils/CartesianUtils';
import GameObject from './GameObject';
import GameObjectProperties from './GameObjectProperties';
import { GameObjectType } from './GameObjectType';
import { IAudioEffect, ResourceMeta } from './IGameObjectProperties';

export default class GameObjectAudioRenderer {
    private object;
    private context;
    private finalNode;
    private panner?: PannerNode;
    private bufferSource?: AudioBufferSourceNode;
    private audioEffect?: IAudioEffect | null = null;
    private maxAudibleDistance;

    constructor(object: GameObject, context: AudioContext, finalNode: AudioNode, maxAudibleDistance: number) {
        this.object = object;
        this.context = context;
        this.finalNode = finalNode;
        this.maxAudibleDistance = maxAudibleDistance;
    }

    isAudioEffectMetaEqual(_audioEffectMeta: ResourceMeta, _objectMeta: ResourceMeta): boolean {
        return true;
    }

    private isAudioEffectMatchingMeta(audioEffect: IAudioEffect, objectMeta: ResourceMeta): boolean {
        if (audioEffect.meta === undefined) {
            return true;
        }

        return this.isAudioEffectMetaEqual(audioEffect.meta, objectMeta);
    }

    private findAudioEffects(type: GameObjectType): IAudioEffect[] | undefined {
        const properties = GameObjectProperties.getTypeProperties(type);
        return properties.audioEffects;
    }

    private findAudioEffect(type: GameObjectType, objectMeta: ResourceMeta | undefined): IAudioEffect | undefined | null {
        if (objectMeta === undefined) {
            return undefined;
        }

        const audioEffects = this.findAudioEffects(type);
        if (audioEffects === undefined) {
            return undefined;
        }

        for (const audioEffect of audioEffects) {
            if (this.isAudioEffectMatchingMeta(audioEffect, objectMeta)) {
                return audioEffect;
            }
        }

        return null;
    }

    updatePannerPosition(): void {
        if (this.panner === undefined) {
            throw new Error('Inconsistent audio effect panner');
        }

        CartesianUtils.setCartesianPositions(this.panner, this.object.centerPosition);
    }

    createPanner(): PannerNode {
        this.panner = new PannerNode(this.context, {
            panningModel: 'HRTF',
            distanceModel: 'linear',
            maxDistance: this.maxAudibleDistance,
        });
        this.panner.connect(this.finalNode);
        return this.panner;
    }

    createBufferSource(): void {
        if (this.audioEffect === undefined || this.audioEffect === null) {
            return;
        }

        if (this.audioEffect.buffer === undefined) {
            return;
        }

        if (this.panner === undefined) {
            throw new Error('Audio effect panner is inconsistent');
        }

        this.bufferSource = new AudioBufferSourceNode(this.context, {
            buffer: this.audioEffect.buffer,
            loop: this.audioEffect.loop ?? false,
        });
        this.bufferSource.connect(this.panner); 
        this.bufferSource.start();
    }

    destroyBufferSource(): boolean {
        if (this.bufferSource === undefined) {
            throw new Error('Audio effect panner is inconsistent');
        }

        this.bufferSource.stop();
        this.bufferSource.disconnect();
        this.bufferSource = undefined;
        return true;
    }

    updateAudioEffect(): IAudioEffect | null | undefined {
        if (this.audioEffect === undefined) {
            return;
        }

        const audioEffect =  this.findAudioEffect(this.object.type, this.object.audioMeta);
        if (audioEffect === undefined) {
            this.audioEffect = undefined;
            return;
        }

        this.audioEffect = audioEffect;
        return this.audioEffect;
    }

    updatePlayingAudioEffect(): void {
        if (this.audioEffect === undefined) {
            return;
        }

        if (this.audioEffect === null || (this.bufferSource !== undefined
            && this.audioEffect.buffer !== this.bufferSource.buffer)) {
            this.destroyBufferSource();
        }

        console.log(Date.now(), this.audioEffect);

        if (this.audioEffect === null || this.audioEffect.buffer === undefined) {
            return;
        }

        if (this.panner === undefined) {
            this.createPanner();
        }

        this.updatePannerPosition();

        if (this.bufferSource !== undefined
            && this.audioEffect.buffer === this.bufferSource.buffer) {
            return;
        }

        this.createBufferSource();
    }

    stopAudioEffect(): void {
        if (this.bufferSource !== undefined) {
            this.destroyBufferSource();
        }
    }
}
