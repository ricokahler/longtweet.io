import React from 'react';
import { S3, DynamoDB } from 'aws-sdk';
import shortId from 'shortid';
import validateToken from '../helpers/validate-token';
import render from 'preact-render-to-string';
import Post from '../components/post';
import wrapLambda from '../helpers/wrap-lambda';
import sanitizeHtml from 'sanitize-html';
import zlib from 'zlib';

const s3 = new S3();

async function getObject(key: string, noUnzip = false) {
  const obj = await s3
    .getObject({
      Bucket: 'longtweet.io',
      Key: key,
    })
    .promise();

  const body = obj.Body as Buffer;

  if (noUnzip) {
    return body;
  }

  const unzipped = await new Promise<Buffer>((resolve, reject) => {
    zlib.unzip(body, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
  return unzipped;
}

const handler: LambdaHandler = async (event) => {
  const tokenPayload = await validateToken(event);
  if (!tokenPayload) {
    return { statusCode: 401 };
  }
  const { user, handle } = tokenPayload;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 404 };
  }

  const id = shortId();
  const post = JSON.parse(event.body || '{}');
  const { title: _title, text } = post;

  if (_title.length > 500) {
    return { statusCode: 400 };
  }

  const dynamodb = new DynamoDB();

  await dynamodb
    .putItem({
      TableName: 'longtweet-posts',
      Item: {
        post_id: {
          S: id,
        },
        user_id: {
          S: user.toString(),
        },
      },
    })
    .promise();

  const createdDate = new Date().toISOString();
  const description = `${sanitizeHtml(text).replace(/"/g, '').slice(0, 200)}…`;
  const title =
    sanitizeHtml(_title).replace(/"/g, '') || `longtweet by @${handle}`;

  const css = await getObject('main.css');
  const postJs = await getObject('post.js');
  const siteManifest = await getObject('site.webmanifest', true);
  const favicon32 = await getObject('favicon-32x32.png', true);
  const favicon16 = await getObject('favicon-16x16.png', true);

  const html = `<!DOCTYPE html>
    <html lang="en">
    <![CDATA[${JSON.stringify({
      summary: Buffer.from(
        sanitizeHtml(_title || text.substring(0, 100)),
      ).toString('base64'),
      createdDate,
    })}]]>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${css.toString()}</style>
      <title>${title}</title>
      <meta
        name="description"
        content="${description}"
      />
      <meta
        name="twitter:title"
        content="${title}"
      />
      <meta
        name="twitter:description"
        content="${description}"
      />
      <meta property="og:title" content="${title}">
      <meta property="og:site_name" content="longtweet.io">
      <meta property="og:url" content="https://longtweet.io/${id}">
      <meta property="og:description" content="${description}">
      <meta property="og:type" content="website">
      <meta property="og:image" content="https://longtweet.io/black.png">
      <meta name="copyright" content="Copyright © 2020 ${sanitizeHtml(
        handle,
      )}" />
      <meta name="author" content="${sanitizeHtml(handle)}" />
      <link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,${favicon32.toString(
        'base64',
      )}">
      <link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,${favicon16.toString(
        'base64',
      )}">
      <link rel="manifest" href="data:application/json;base64,${siteManifest.toString(
        'base64',
      )}">
    </head>
    <body>${render(
      <Post
        title={_title}
        text={text}
        user={user.toString()}
        postId={id}
        createdDate={createdDate}
        handle={handle}
      />,
    )}
    <script>${postJs.toString()}</script>
    </body>
  </html>`;

  const zippedHtml = await new Promise<Buffer>((resolve, reject) => {
    zlib.gzip(html, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

  await s3
    .upload({
      Bucket: 'longtweet.io',
      Key: id,
      Body: zippedHtml,
      ACL: 'public-read',
      ContentType: 'text/html',
      ContentEncoding: 'gzip',
      Tagging: `user=${encodeURIComponent(user)}`,
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify({ id }),
  };
};

const wrapped = wrapLambda(handler);
export { wrapped as handler };
