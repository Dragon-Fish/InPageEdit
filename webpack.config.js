'use strict';

const path = require('path');

// eslint-disable-next-line no-undef
const isMinify = process.env.MINIFY

module.exports = {
  entry: {
    'InPageEdit': './src/index.js'
  },
  // eslint-disable-next-line no-undef
  context: path.resolve(__dirname),
  watchOptions: {
    ignored: /(node_modules|dist)/
  },
  mode: isMinify ? 'production' : 'development',
  output: {
    // eslint-disable-next-line no-undef
    path: path.resolve(__dirname, 'dist'),
    filename: isMinify ? '[name].min.js' : '[name].js',
    // publicPath: 'pathOrUrlWhenProductionBuild'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      }
    ]
  },
  resolve: {
  },
  devtool: 'source-map',
  plugins: [
  ],
  optimization: {
    minimize: isMinify ? true : false
  }
};
