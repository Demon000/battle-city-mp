module.exports = {
    pages: {
        index: {
            entry: 'client/main.ts',
            template: 'client/index.html',
            filename: 'index.html',
        },
    },
    chainWebpack: config => {
        config.optimization.delete('splitChunks');
    },
};
