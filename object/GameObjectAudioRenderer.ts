import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { assert } from '@/utils/assert';
import { CartesianUtils } from '@/utils/CartesianUtils';
import { GameObject } from './GameObject';
import { AudioEffect, ResourceMeta } from './GameObjectProperties';

export class GameObjectAudioRenderer {
    private context;
    private finalNode;
    private panner?: PannerNode;
    private bufferSource?: AudioBufferSourceNode;
    private audioEffect?: AudioEffect | null = null;
    private maxAudibleDistance;
    object;

    constructor(object: GameObject, context: AudioContext, finalNode: AudioNode, maxAudibleDistance: number) {
        this.object = object;
        this.context = context;
        this.finalNode = finalNode;
        this.maxAudibleDistance = maxAudibleDistance;
    }

    protected isAudioEffectMetaEqual(_audioEffectMeta: ResourceMeta, _objectMeta: ResourceMeta): boolean {
        return true;
    }

    private isAudioEffectMatchingMeta(audioEffect: AudioEffect, objectMeta: ResourceMeta): boolean {
        if (audioEffect.meta === undefined) {
            return true;
        }

        return this.isAudioEffectMetaEqual(audioEffect.meta, objectMeta);
    }

    private findAudioEffectMatchingMeta(objectMeta: ResourceMeta): AudioEffect | undefined | null {
        const audioEffects = this.object.audioEffects;
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
        assert(this.panner !== undefined,
            'Inconsistent audio effect panner');

        const centerPosition = this.object.getComponent(CenterPositionComponent);
        CartesianUtils.setCartesianPositions(this.panner, centerPosition);
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

        assert(this.panner !== undefined,
            'Inconsistent audio effect panner');

        this.bufferSource = new AudioBufferSourceNode(this.context, {
            buffer: this.audioEffect.buffer,
            loop: this.audioEffect.loop ?? false,
        });
        this.bufferSource.connect(this.panner); 
        this.bufferSource.start();
    }

    private destroyBufferSource(): boolean {
        assert(this.bufferSource !== undefined,
            'Inconsistent audio effect buffer source');

        this.bufferSource.stop();
        this.bufferSource.disconnect();
        this.bufferSource = undefined;
        return true;
    }

    update(): AudioEffect | null | undefined {
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

        return this.audioEffect = this.findAudioEffectMatchingMeta(objectMeta);
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
