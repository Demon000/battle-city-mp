import { CLIENT_CONFIG_VISIBLE_GAME_SIZE, CLIENT_SOUNDS_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import { AudioEffectLoadingState, IAudioEffect } from '@/object/IGameObjectProperties';
import Point from '@/physics/point/Point';
import axios from 'axios';

interface CartesianPositioned {
    readonly positionX: AudioParam;
    readonly positionY: AudioParam;
    readonly positionZ: AudioParam;
}

export default class GameAudioService {
    private context;
    private compressorNode;
    private finalNode;
    private objectsPlayingAudioEffects = new Set<GameObject>();

    constructor() {
        this.context = new AudioContext();
        this.compressorNode = new DynamicsCompressorNode(this.context);
        this.compressorNode.connect(this.context.destination);
        this.finalNode = this.compressorNode;
    }

    setCartesianPositions(positioned: CartesianPositioned, point: Point): void {
        positioned.positionX.value = point.y;
        positioned.positionY.value = 1;
        positioned.positionZ.value = -point.x; 
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

    createObjectAudioEffectPanner(): PannerNode {
        const panner = new PannerNode(this.context, {
            panningModel: 'HRTF',
            distanceModel: 'linear',
            maxDistance: CLIENT_CONFIG_VISIBLE_GAME_SIZE / 2,
        });
        panner.connect(this.finalNode);
        return panner;
    }

    stopObjectAudioEffectIfDifferent(object: GameObject, audioEffect?: IAudioEffect): boolean {
        if (object.audioEffectBufferSource === undefined) {
            return true;
        }

        if (audioEffect !== undefined
            && object.audioEffectBufferSource.buffer === audioEffect.buffer) {
            return false;
        }

        object.audioEffectBufferSource.stop();
        object.audioEffectBufferSource.disconnect();
        object.audioEffectBufferSource = undefined;
        return true;
    }

    createObjectAudioBufferSource(object: GameObject, audioEffect: IAudioEffect | undefined): void {
        if (audioEffect === undefined) {
            throw new Error('Audio effect is inconsistent');
        }

        if (audioEffect.buffer === undefined) {
            throw new Error('Audio effect buffer is inconsistent');
        }

        if (object.audioEffectPanner === undefined) {
            throw new Error('Audio effect panner is inconsistent');
        }

        const source = new AudioBufferSourceNode(this.context, {
            buffer: audioEffect.buffer,
            loop: audioEffect.loop ?? false,
        });
        source.connect(object.audioEffectPanner);
        source.start();
        object.audioEffectBufferSource = source;
    }

    playObjectSounds(objects: GameObject[], point: Point): void {
        this.setCartesianPositions(this.context.listener, point);
        this.context.listener.forwardX.value = -1;
        this.context.listener.forwardY.value = 0;
        this.context.listener.forwardZ.value = 0;

        const objectsCurrentlyPlayingAudioEffects = new Set<GameObject>();
        for (const object of objects) {
            if (!object.hasAudioEffects) {
                continue;
            }

            if (object.audioEffectPanner === undefined) {
                object.audioEffectPanner = this.createObjectAudioEffectPanner();
            }

            this.setCartesianPositions(object.audioEffectPanner, object.centerPosition);

            // Retrieve the current object audio effect
            const audioEffect = object.audioEffect;

            // Try to stop any ongoing effect if the current audio effect is different
            const stoppedAudioEffect = this.stopObjectAudioEffectIfDifferent(object, audioEffect);

            // The objects has no current audio effect
            if (audioEffect === undefined) {
                continue;
            }

            // If we stopped the old audio effect, it means that it differed
            // Load and play the new audio effect
            if (stoppedAudioEffect) {
                const loadedBuffer = this.loadAudioEffectBuffer(audioEffect);
                if (!loadedBuffer) {
                    continue;
                }

                this.createObjectAudioBufferSource(object, audioEffect);
            }

            // Keep track of the currently playing audio effects
            // And stop the ones that are no longer playing
            objectsCurrentlyPlayingAudioEffects.add(object);
        }

        for (const object of this.objectsPlayingAudioEffects) {
            if (!objectsCurrentlyPlayingAudioEffects.has(object)) {
                this.stopObjectAudioEffectIfDifferent(object);
            }
        }

        this.objectsPlayingAudioEffects = objectsCurrentlyPlayingAudioEffects;
    }
}
