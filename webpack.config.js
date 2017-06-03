const webpack = require('webpack')
const path = require('path')

module.exports = {
    entry: './src/index.js',

    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist')
    },

    devtool: 'source-map',

    module: {
        loaders: [
            {
                loader: 'babel-loader',
                include: path.join(__dirname, 'src'),
                test: /\.js$/,
                query: {
                    presets: ['es2015'],
                    plugins: [['transform-react-jsx', {pragma: 'h'}]]
                }
            }
        ]
    }
}
