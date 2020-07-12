import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import builtins from 'builtin-modules';
// @ts-ignore
import WebpackModules from 'webpack-modules';

async function bundle(inputPath: string) {
  const outputPath = path.resolve(__dirname, './dist');
  const compiler = webpack({
    mode: 'none',
    entry: inputPath,
    output: {
      path: outputPath,
      filename: 'index.js',
      libraryTarget: 'commonjs',
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
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript',
              '@babel/preset-react',
            ],
          },
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.css'],
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
    target: 'node',
    externals: [...builtins],
    plugins: [new WebpackModules()],
  });

  const fs = Object.assign(createFsFromVolume(new Volume()), {
    join: path.join.bind(path),
  });

  compiler.outputFileSystem = fs;

  await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(stats.toString());
        return reject(err);
      } else {
        resolve();
      }
    });
  });

  return await fs.promises.readFile(`${outputPath}/index.js`);
}

export default bundle;
