import { DynamoDB } from 'aws-sdk';
import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import wrappedLambda from '../helpers/wrap-lambda';

const handler: LambdaHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 404 };
  }

  if (!event.body) {
    return { statusCode: 400 };
  }

  const { sessionId, oauthToken, oauthVerifier } = JSON.parse(event.body);
  if (!sessionId || !oauthToken || !oauthVerifier) {
    return { statusCode: 400 };
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
    return { statusCode: 404 };
  }

  if (item.session_id.S !== sessionId || item.oauth_token.S !== oauthToken) {
    return { statusCode: 403 };
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

  const tokenId = uuid();
  const signature = crypto.randomBytes(64).toString('base64');

  const sevenDays = 1000 * 60 * 60 * 24 * 7;

  await new Promise((resolve, reject) => {
    dynamodb.putItem(
      {
        TableName: 'longtweet-users',
        Item: {
          token_id: {
            S: tokenId,
          },
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
          exp: {
            N: Math.floor((Date.now() + sevenDays) / 1000).toString(),
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

  return {
    statusCode: 200,
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
};

const wrapped = wrappedLambda(handler);
export { wrapped as handler };
