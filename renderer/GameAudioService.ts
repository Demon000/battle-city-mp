import { CLIENT_SOUNDS_RELATIVE_URL } from '@/config';
import GameObject from '@/object/GameObject';
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

    playObjectSounds(objects: GameObject[], point: Point): void {
        this.setCartesianPositions(this.context.listener, point);
        this.context.listener.forwardX.value = -1;
        this.context.listener.forwardY.value = 0;
        this.context.listener.forwardZ.value = 0;

        for (const object of objects) {
            if (object.panner === undefined) {
                object.panner = this.context.createPanner();
                object.panner.panningModel = 'HRTF';
                object.panner.connect(this.context.destination);
            }

            this.setCartesianPositions(object.panner, object.position);

            const audioEffect = object.audioEffect;
            if (audioEffect === undefined) {
                continue;
            }

            if (audioEffect.buffer === undefined) {
                axios.get(`${CLIENT_SOUNDS_RELATIVE_URL}/${audioEffect.filename}`, {
                    responseType: 'arraybuffer',
                }).then(response => {
                    return this.context.decodeAudioData(response.data);
                }).then(buffer => {
                    audioEffect.buffer = buffer;
                });
            }

            if (audioEffect.buffer === undefined) {
                continue;
            }

            if (object.isPlayingAudio) {
                continue;
            }

            const source = this.context.createBufferSource();
            source.buffer = audioEffect.buffer;
            source.connect(object.panner);
            source.start();
            object.isPlayingAudio = true;
        }
    }
}
