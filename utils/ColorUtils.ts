import { Color } from '@/drawable/Color';

export class ColorUtils {
    static getRgbFromColor(color: Color): string {
        return '#' + color.map(n => {
            let s = n.toString(16);
            if (s.length == 1) {
                s = '0' + s;
            }

            return s;
        }).join('');
    }

    static getColorFromRgb(rgb: string): Color {
        const parts = [];
        rgb = rgb.slice(1);

        while (rgb.length) {
            const part = rgb.slice(0, 2);
            parts.push(Number.parseInt(part, 16));
            rgb = rgb.slice(2);
        }

        return parts as Color;
    }
}