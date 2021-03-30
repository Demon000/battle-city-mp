import { CLIENT_SOUNDS_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
import { IAudioEffect } from '@/object/IGameObjectProperties';
import Point from '@/physics/point/Point';
import axios from 'axios';

interface CartesianPositioned {
    readonly positionX: AudioParam;
    readonly positionY: AudioParam;
    readonly positionZ: AudioParam;
}

export default class GameAudioService {
    private context;

    constructor() {
        this.context = new AudioContext();
    }

    setCartesianPositions(positioned: CartesianPositioned, point: Point): void {
        positioned.positionX.value = point.y;
        positioned.positionY.value = 1;
        positioned.positionZ.value = -point.x; 
    }

    loadAudioEffectBuffer(audioEffect: IAudioEffect | undefined): boolean {
        if (audioEffect === undefined) {
            return false;
        }

        if (audioEffect.buffer !== undefined) {
            return true;
        }

        axios.get(`${CLIENT_SOUNDS_RELATIVE_URL}/${audioEffect.filename}`, {
            responseType: 'arraybuffer',
        }).then(response => {
            return this.context.decodeAudioData(response.data);
        }).then(buffer => {
            audioEffect.buffer = buffer;
        });

        return audioEffect.buffer !== undefined;
    }

    createObjectAudioEffectPanner(object: GameObject): boolean {
        if (object.audioEffectPanner !== undefined) {
            return true;
        }

        object.audioEffectPanner = this.context.createPanner();
        object.audioEffectPanner.panningModel = 'HRTF';
        object.audioEffectPanner.connect(this.context.destination);

        return false;
    }

    stopObjectAudioEffectIfDifferent(object: GameObject, audioEffect: IAudioEffect | undefined): boolean {
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

        const source = this.context.createBufferSource();
        source.loop = audioEffect.loop ?? false;
        source.buffer = audioEffect.buffer;
        source.connect(object.audioEffectPanner);
        source.addEventListener('ended', () => {
            object.audioEffectBufferSource = undefined;
        });
        source.start();
        object.audioEffectBufferSource = source;
    }

    playObjectSounds(objects: GameObject[], point: Point): void {
        this.setCartesianPositions(this.context.listener, point);
        this.context.listener.forwardX.value = -1;
        this.context.listener.forwardY.value = 0;
        this.context.listener.forwardZ.value = 0;

        for (const object of objects) {
            this.createObjectAudioEffectPanner(object);
            if (!object.audioEffectPanner) {
                throw new Error('Failed to create audio effect panner');
            }

            this.setCartesianPositions(object.audioEffectPanner, object.position);

            const audioEffect = object.audioEffect;
            const stoppedAudioEffect = this.stopObjectAudioEffectIfDifferent(object, audioEffect);
            if (!stoppedAudioEffect) {
                continue;
            }

            const loadedBuffer = this.loadAudioEffectBuffer(audioEffect);
            if (!loadedBuffer) {
                continue;
            }

            this.createObjectAudioBufferSource(object, audioEffect);
        }
    }
}
