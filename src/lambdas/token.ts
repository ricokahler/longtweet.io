import { DynamoDB } from 'aws-sdk';
import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type',
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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 404, headers: corsHeaders };
  }

  if (!event.body) {
    return { statusCode: 400, headers: corsHeaders };
  }

  const { sessionId, oauthToken, oauthVerifier } = JSON.parse(event.body);
  if (!sessionId || !oauthToken || !oauthVerifier) {
    return { statusCode: 400, headers: corsHeaders };
  }

  const dynamodb = new DynamoDB();

  const item = await new Promise<DynamoDB.AttributeMap | undefined>(
    (resolve, reject) => {
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
            resolve(result.Item);
          }
        },
      );
    },
  );

  if (!item) {
    return { statusCode: 404, headers: corsHeaders };
  }

  if (item.session_id.S !== sessionId || item.oauth_token.S !== oauthToken) {
    return { statusCode: 403, headers: corsHeaders };
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

  const searchParams = new URLSearchParams();
  searchParams.append('oauth_verifier', oauthVerifier);

  const response = await fetch('https://api.twitter.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...oauth.toHeader(
        oauth.authorize(
          {
            url: 'https://api.twitter.com/oauth/access_token',
            method: 'POST',
          },
          { key: oauthToken, secret: '' },
        ),
      ),
    },
    body: searchParams.toString(),
  });

  if (!response.ok) {
    return { statusCode: 500 };
  }

  const result = new URLSearchParams(await response.text());
  const token = result.get('oauth_token');
  const tokenSecret = result.get('oauth_token_secret');
  const userId = result.get('user_id');
  const handle = result.get('screen_name');

  if (!token || !tokenSecret || !userId || !handle) {
    throw new Error('Missing data from oauth access_token response');
  }

  const signature = crypto.randomBytes(64).toString('base64');

  await new Promise((resolve, reject) => {
    // TODO: this currently overrides any previous logins. This is nice from a
    // security standpoint but could possibly lead to a bad user experience
    // where a user would be logged out by logging into another device.
    dynamodb.putItem(
      {
        TableName: 'longtweet-users',
        Item: {
          user_id: {
            N: userId,
          },
          oauth_token: {
            S: token,
          },
          oauth_token_secret: {
            S: tokenSecret,
          },
          handle: {
            S: handle,
          },
          signature: {
            S: signature,
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

  const sevenDays = 1000 * 60 * 60 * 24 * 7;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      token: jwt.sign(
        {
          user: parseInt(userId, 10),
          handle,
          exp: Math.floor((Date.now() + sevenDays) / 1000),
        },
        signature,
      ),
    }),
  };
}

export { handler };
