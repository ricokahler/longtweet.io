import webpack from 'webpack';
import render from 'preact-render-to-string';
import React from 'react';
import { JSDOM } from 'jsdom';
import head from './head';
import App from '../components/app';

class ServerRenderPlugin implements webpack.Plugin {
  apply(compiler: webpack.Compiler) {
    const plugin = { name: 'ServerRenderPlugin' };

    compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
      compilation.hooks.additionalAssets.tap(plugin, () => {
        const jsdom = new JSDOM();
        const { document } = jsdom.window;

        const root = document.createElement('div');
        root.id = 'root';

        document.head.innerHTML = head;

        if (process.env.NODE_ENV === 'production') {
          const appHtml = render(<App />);
          root.innerHTML = appHtml;
        }

        document.body.appendChild(root);

        const script = document.createElement('script');
        script.src = '/longtweet.js';
        document.body.appendChild(script);

        const html = jsdom.serialize();

        compilation.assets['index.html'] = {
          source: () => html,
          size: () => html.length,
        };
      });
    });
  }
}

export default ServerRenderPlugin;
