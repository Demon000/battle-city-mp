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

    protected isAudioEffectMetaEqual(_audioEffectMeta: ResourceMeta, _objectMeta: ResourceMeta): boolean {
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

    private findAudioEffectMatchingMeta(type: GameObjectType, objectMeta: ResourceMeta): IAudioEffect | undefined | null {
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

    private updatePannerPosition(): void {
        if (this.panner === undefined) {
            throw new Error('Inconsistent audio effect panner');
        }

        CartesianUtils.setCartesianPositions(this.panner, this.object.centerPosition);
    }

    private createPanner(): PannerNode {
        this.panner = new PannerNode(this.context, {
            panningModel: 'HRTF',
            distanceModel: 'linear',
            maxDistance: this.maxAudibleDistance,
        });
        this.panner.connect(this.finalNode);
        return this.panner;
    }

    private createBufferSource(): void {
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

    private destroyBufferSource(): boolean {
        if (this.bufferSource === undefined) {
            throw new Error('Audio effect panner is inconsistent');
        }

        this.bufferSource.stop();
        this.bufferSource.disconnect();
        this.bufferSource = undefined;
        return true;
    }

    update(): IAudioEffect | null | undefined {
        if (this.audioEffect === undefined) {
            return;
        }

        const objectMeta = this.object.audioMeta;
        if (objectMeta === undefined) {
            this.audioEffect = undefined;
            return;
        }

        if (objectMeta === null) {
            this.audioEffect = null;
            return null;
        }

        if (this.audioEffect !== null
            && this.isAudioEffectMatchingMeta(this.audioEffect, objectMeta)) {
            return this.audioEffect;
        }

        this.audioEffect = this.findAudioEffectMatchingMeta(this.object.type, objectMeta);
        return this.audioEffect;
    }

    play(): void {
        if (this.audioEffect === undefined) {
            return;
        }

        if (this.audioEffect === null || (this.bufferSource !== undefined
            && this.audioEffect.buffer !== this.bufferSource.buffer)) {
            this.destroyBufferSource();
        }

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

    stop(): void {
        if (this.bufferSource !== undefined) {
            this.destroyBufferSource();
        }
    }
}