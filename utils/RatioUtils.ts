export default class RatioUtils {
    static scaleForDevicePixelRatio(value: number): number {
        return Math.ceil(value * window.devicePixelRatio);
    } 
}
