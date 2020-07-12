require('../scripts/register');
const path = require('path');
const { EnvironmentPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackModules = require('webpack-modules');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: require.resolve('./post-entry'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          babelrc: false,
          presets: [
            ['@babel/preset-env', { targets: 'defaults and not IE 11' }],
            '@babel/preset-typescript',
            '@babel/preset-react',
          ],
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new WebpackModules(),
    new EnvironmentPlugin({
      NODE_ENV: 'development',
    }),
    new HtmlWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  devtool: process.env.NODE_ENV === 'production' ? undefined : 'source-map',
};
