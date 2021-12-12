import { Config } from '@/config/Config';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { Player } from '@/player/Player';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';

export enum ChunkServiceEvent {
    PLAYER_LOAD_CHUNK = 'player-load-chunk',
    PLAYER_UNLOAD_CHUNK = 'player-unload-chunk',
}

export interface ChunkServiceEvents {
    [ChunkServiceEvent.PLAYER_LOAD_CHUNK]: (player: Player, box: BoundingBox) => void;
    [ChunkServiceEvent.PLAYER_UNLOAD_CHUNK]: (player: Player, box: BoundingBox) => void;
}

export class ChunkService {
    emitter = new EventEmitter<ChunkServiceEvents>();

    private chunkSize: number;
    private visibleChunks: number;

    constructor(private config: Config) {
        this.chunkSize = this.config.get<number>('chunk', 'chunkSize');
        this.visibleChunks = this.config.get<number>('chunk', 'visibleChunks');
    }

    getChunkCoords(n: number): number {
        return n - n % this.chunkSize;
    }

    getChunkBoundingBox(x: number, y: number): BoundingBox {
        return BoundingBoxUtils.create(x, y, x + this.chunkSize,
            y + this.chunkSize);
    }

    updatePlayerVisibleChunks(player: Player, position: Point): void {
        const centerChunkX = this.getChunkCoords(position.x);
        const centerChunkY = this.getChunkCoords(position.y);

        const offset = ((this.visibleChunks - 1) / 2) * this.chunkSize;
        const tlChunkX = centerChunkX - offset;
        const tlChunkY = centerChunkY - offset;
        const brChunkX = centerChunkX + this.chunkSize + offset;
        const brChunkY = centerChunkY + this.chunkSize + offset;

        player.visibleAreaBoundingBox.tl.x = tlChunkX;
        player.visibleAreaBoundingBox.tl.y = tlChunkY;
        player.visibleAreaBoundingBox.br.x = brChunkX;
        player.visibleAreaBoundingBox.br.y = brChunkY;

        for (const x of player.chunkMap.keys()) {
            const innerMap = player.chunkMap.get(x);
            assert(innerMap !== undefined);

            for (const y of innerMap.keys()) {
                innerMap.set(y, false);
            }
        }

        for (let x = tlChunkX; x < brChunkX; x += this.chunkSize) {
            let innerMap = player.chunkMap.get(x);
            if (innerMap === undefined) {
                innerMap = new Map();
                player.chunkMap.set(x, innerMap);
            }

            for (let y = tlChunkY; y < brChunkY; y += this.chunkSize) {
                let load = false;

                if (innerMap.get(y) === undefined) {
                    load = true;
                }

                innerMap.set(y, true);

                if (load) {
                    this.emitter.emit(ChunkServiceEvent.PLAYER_LOAD_CHUNK,
                        player, this.getChunkBoundingBox(x, y));
                }
            }
        }

        for (const x of player.chunkMap.keys()) {
            const innerMap = player.chunkMap.get(x);
            assert(innerMap !== undefined);

            for (const y of innerMap.keys()) {
                if (innerMap.get(y)) {
                    continue;
                }

                innerMap.delete(y);
                this.emitter.emit(ChunkServiceEvent.PLAYER_UNLOAD_CHUNK,
                    player, this.getChunkBoundingBox(x, y));
            }

            if (innerMap.size === 0) {
                player.chunkMap.delete(x);
            }
        }
    }
}
