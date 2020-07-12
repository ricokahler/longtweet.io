import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { DynamoDB } from 'aws-sdk';

async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 404 };
  }

  if (!event.body) {
    return { statusCode: 400 };
  }

  const sessionId = new URLSearchParams(event.body).get('session_id');

  if (!sessionId) {
    return { statusCode: 400 };
  }

  const dynamodb = new DynamoDB();

  const foundSession = await new Promise<boolean>((resolve, reject) => {
    dynamodb.getItem(
      {
        TableName: 'longtweet-login',
        Key: {
          session_id: {
            S: sessionId,
          },
        },
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(Boolean(result.Item));
        }
      },
    );
  });

  if (!foundSession) {
    return { statusCode: 404 };
  }

  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_CONSUMER_KEY!,
      secret: process.env.TWITTER_CONSUMER_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (base_string, key) => {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });

  const response = await fetch('https://api.twitter.com/oauth/request_token', {
    method: 'POST',
    headers: {
      ...oauth.toHeader(
        oauth.authorize({
          url: 'https://api.twitter.com/oauth/request_token',
          method: 'POST',
        }),
      ),
    },
  });

  const searchParams = new URLSearchParams(await response.text());
  const oauthToken = searchParams.get('oauth_token');

  if (!oauthToken) {
    throw new Error('Expected oauth_token');
  }

  await new Promise((resolve, reject) => {
    dynamodb.putItem(
      {
        TableName: 'longtweet-login',
        Item: {
          session_id: {
            S: sessionId,
          },
          oauth_token: {
            S: oauthToken,
          },
          exp: {
            N: Math.floor((Date.now() + 2 * 1000 * 60) / 1000).toString(),
          },
        },
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );
  });

  return {
    statusCode: 302,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': 'https://longtweet.io',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      location: `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`,
    },
  };
}

export { handler };
