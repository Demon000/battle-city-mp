import { Color } from '@/drawable/Color';

export interface PlayerStats {
    id: string;
    name: string,
    kills: number,
    deaths: number,
    points: number;
    color: Color;
    tier: string,
}
