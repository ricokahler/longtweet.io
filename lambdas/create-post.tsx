import React from 'react';
import { S3, DynamoDB } from 'aws-sdk';
import shortId from 'shortid';
import validateToken from '../helpers/validate-token';
import render from 'preact-render-to-string';
import Post from '../components/post';
import head from '../helpers/head';
import wrapLambda from '../helpers/wrap-lambda';

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
  const { title, text } = post;

  const dynamodb = new DynamoDB();

  await new Promise((resolve, reject) => {
    dynamodb.putItem(
      {
        TableName: 'longtweet-posts',
        Item: {
          post_id: {
            S: id,
          },
          user_id: {
            N: user.toString(),
          },
        },
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });

  const createdDate = new Date().toISOString();

  const html = `<html>
    <![CDATA[${JSON.stringify({
      summary: title || text.substring(0, 100),
      createdDate,
    })}]]>
    <head>${head}</head>
    <body>${render(
      <Post
        title={title}
        text={text}
        user={user.toString()}
        postId={id}
        createdDate={createdDate}
        handle={handle}
      />,
    )}</body>
  </html>`;

  await new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: 'longtweet.io',
        Key: id,
        Body: Buffer.from(html),
        ACL: 'public-read',
        ContentType: 'text/html',
        Tagging: `user=${encodeURIComponent(user)}`,
      },
      (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });

  return {
    statusCode: 201,
    body: JSON.stringify({ id }),
  };
};

const wrapped = wrapLambda(handler);
export { wrapped as handler };
