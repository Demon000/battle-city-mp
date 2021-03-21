const path = require('path');

module.exports = {
    pages: {
        index: {
            entry: 'client/main.ts',
            template: 'client/index.html',
            filename: 'index.html',
        },
    },
    configureWebpack: {
        resolve: {
            alias: {
                '@': path.resolve(__dirname),
            },
        },
    },
    chainWebpack: config => {
        config.optimization.delete('splitChunks');
    },
};
