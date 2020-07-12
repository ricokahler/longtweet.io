import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
// @ts-ignore
import babel from '@rollup/plugin-babel';

const extensions = ['.js', '.ts', '.tsx'];

async function bundleInitPostControls() {
  const build = await rollup({
    input: require.resolve('./init-post-controls'),
    plugins: [
      resolve({ extensions }),
      babel({
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: 'defaults and not IE 11' }],
          '@babel/preset-typescript',
        ],
        babelHelpers: 'bundled',
        extensions,
      }),
      terser(),
    ],
  });

  const { output } = await build.generate({
    format: 'iife',
    name: 'PostControls',
  });
  if (output.length !== 1) {
    throw new Error('expected only one chunk');
  }
  const [chunk] = output;
  const { code } = chunk;
  return code;
}

export default bundleInitPostControls;
