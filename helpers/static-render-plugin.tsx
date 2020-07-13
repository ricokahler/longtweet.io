import webpack from 'webpack';
import render from 'preact-render-to-string';
import React from 'react';
import { JSDOM } from 'jsdom';
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

        document.head.innerHTML = `
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/main.css" />
        <title>longtweet.io</title>
        <meta
          name="description"
          content="simple ad-free, tracker-free posts"
        />
        <meta
          name="twitter:title"
          content="longtweet.io"
        />
        <meta
          name="twitter:description"
          content="simple ad-free, tracker-free posts"
        />
        <meta property="og:title" content="longtweet.io">
        <meta property="og:site_name" content="longtweet.io">
        <meta property="og:url" content="https://longtweet.io">
        <meta property="og:description" content="simple ad-free, tracker-free posts">
        <meta property="og:type" content="website">
        <meta property="og:image" content="https://longtweet.io/black.png">
        <meta name="copyright" content="Copyright © 2020 Rico Kahler" />
        <meta name="author" content="Rico Kahler" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="manifest" href="/site.webmanifest">
        `;

        if (process.env.NODE_ENV === 'production') {
          const appHtml = render(<App />);
          root.innerHTML = appHtml;
        }

        document.body.appendChild(root);

        const script = document.createElement('script');
        script.src = '/longtweet.js';
        document.body.appendChild(script);

        const html = `<!DOCTYPE html>${jsdom
          .serialize()
          .replace(/<html>/, '<html lang="en">')}`;

        compilation.assets['index.html'] = {
          source: () => html,
          size: () => html.length,
        };
      });
    });
  }
}

export default ServerRenderPlugin;
