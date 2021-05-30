export default class WebpackUtils {
    static getImageUrl(image: string): void {
        const images = require.context('../../client/assets/images/', false, /\.png$/);
        return images('./' + image + '.png');
    }
}
