require('./scripts/register');
const path = require('path');
const fs = require('fs');
const { EnvironmentPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const StaticRenderPlugin = require('./utils/static-render-plugin').default;
const WebpackModules = require('webpack-modules');

function getLambdaPaths() {
  const files = fs
    .readdirSync(path.resolve(__dirname, './src/lambdas'))
    .map((filename) => filename.substring(0, filename.length - 3));

  return files;
}

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: require.resolve('./utils/app-entry'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'longtweet.js',
    chunkFilename: '[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?/,
        loader: 'babel-loader',
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
    new StaticRenderPlugin(),
    new WebpackModules(),
    new EnvironmentPlugin({
      NODE_ENV: 'development',
      ORIGIN:
        process.env.NODE_ENV === 'production' ? 'https://api.longtweet.io' : '',
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  devServer: {
    proxy: getLambdaPaths().reduce((acc, next) => {
      acc[`/${next}`] = {
        target: 'https://api.longtweet.io',
        changeOrigin: true,
      };
      return acc;
    }, {}),
    historyApiFallback: true,
  },
  devtool: process.env.NODE_ENV === 'production' ? undefined : 'source-map',
};
