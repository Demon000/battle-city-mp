module.exports = {
    'env': {
        'node': true,
        'browser': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-essential',
        '@vue/standard',
        '@vue/typescript/recommended',
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 12,
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'linebreak-style': ['error', 'unix'],

        'indent': 'off',
        '@typescript-eslint/indent': ['error', 4],

        'comma-dangle': 'off',
        '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],

        'quotes': 'off',
        '@typescript-eslint/quotes': ['error', 'single'],

        'semi': 'off',
        '@typescript-eslint/semi': ['error', 'always'],

        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': ['error'],

        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': ['error', {
            'anonymous': 'always',
            'asyncArrow': 'always',
            'named': 'never',
        }],

        'vue/no-unused-components': ['warn'],
        'vue/comment-directive': 'off',
    }
};
