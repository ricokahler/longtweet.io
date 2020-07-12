import React from 'react';
import { S3, DynamoDB } from 'aws-sdk';
import shortId from 'shortid';
import validateToken from '../helpers/validate-token';
import render from 'preact-render-to-string';
import Post from '../components/post';
import head from '../helpers/head';
import wrapLambda from '../helpers/wrap-lambda';
import sanitizeHtml from 'sanitize-html';

const handler: LambdaHandler = async (event) => {
  const tokenPayload = await validateToken(event);
  if (!tokenPayload) {
    return { statusCode: 401 };
  }
  const { user, handle } = tokenPayload;

  const s3 = new S3();

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
          N: user.toString(),
        },
      },
    })
    .promise();

  const createdDate = new Date().toISOString();
  const description = `${sanitizeHtml(text).replace(/"/g, '').slice(0, 200)}…`;
  const title = sanitizeHtml(_title).replace(/"/g, '');

  const html = `<!DOCTYPE html>
    <html lang="en">
    <![CDATA[${JSON.stringify({
      summary: Buffer.from(
        sanitizeHtml(_title || text.substring(0, 100)),
      ).toString('base64'),
      createdDate,
    })}]]>
    <head>
      ${head}
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
      <meta name="copyright" content="Copyright © 2020 ${sanitizeHtml(handle)}" />
      <meta name="author" content="${sanitizeHtml(handle)}" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="manifest" href="/site.webmanifest">
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
    <script src="/post.js"></script>
    </body>
  </html>`;

  await s3
    .upload({
      Bucket: 'longtweet.io',
      Key: id,
      Body: Buffer.from(html),
      ACL: 'public-read',
      ContentType: 'text/html',
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
