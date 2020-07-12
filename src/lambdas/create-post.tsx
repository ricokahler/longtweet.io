import React from 'react';
import { S3, DynamoDB } from 'aws-sdk';
import shortId from 'shortid';
import validateToken from '../helpers/validate-token';
import render from 'preact-render-to-string';
import Post from '../../utils/post';
import head from '../../utils/head';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Origin': 'https://longtweet.io',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
    };
  }

  if (!(await validateToken(event))) {
    return {
      statusCode: 401,
      headers: corsHeaders,
    };
  }

  const match = /bearer\s*(.*)/i.exec(event.headers.Authorization);
  if (!match) {
    return {
      statusCode: 401,
      headers: corsHeaders,
    };
  }
  const token = match[1];

  const [, encodedPayload] = token.split('.');
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  const { user } = payload;

  const s3 = new S3();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 404,
      headers: corsHeaders,
    };
  }

  const id = shortId();
  const post = JSON.parse(event.body);
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
            N: user,
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

  const html = `<html>
    <head>${head}</head>
    <body>${render(
      <Post title={title} text={text} user={user.toString()} postId={id} />,
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
    headers: {
      ...corsHeaders,
    },
  };
}

// @ts-ignore
const wrapped = async (event: any) => {
  try {
    return await handler(event);
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: e?.message, stack: e?.stack }),
      headers: corsHeaders,
    };
  }
};

export { wrapped as handler };
