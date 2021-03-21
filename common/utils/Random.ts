export default class Random {
    static getRandomArrayElement<T>(list: T[]): T {
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }
}