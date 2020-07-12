import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';

async function validateToken(event: any) {
  if (process.env.DEV_ENV) {
    return true;
  }

  const match = /bearer\s*(.*)/i.exec(event.headers.Authorization);
  if (!match) {
    return false;
  }
  const token = match[1];

  const dynamodb = new DynamoDB();

  const [, encodedPayload] = token.split('.');
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  const { user } = payload;

  const item = await new Promise<DynamoDB.AttributeMap>((resolve, reject) => {
    dynamodb.getItem(
      {
        TableName: 'longtweet-users',
        Key: {
          user_id: {
            N: user.toString(),
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
  });

  const id = parseInt(item.user_id.N || '', 10);
  const oauthToken = item.oauth_token.S;
  const oauthTokenSecret = item.oauth_token_secret.S;
  const signature = item.signature.S;

  if (!oauthToken || !oauthTokenSecret || !signature || !id) {
    throw new Error('Missing some fields from user entry');
  }

  // throws if invalid
  const validToken = (() => {
    try {
      jwt.verify(token, signature);
      return true;
    } catch {
      return false;
    }
  })();

  if (!validToken) {
    return false;
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

  const response = await fetch(
    'https://api.twitter.com/1.1/account/verify_credentials.json',
    {
      headers: {
        ...oauth.toHeader(
          oauth.authorize(
            {
              url:
                'https://api.twitter.com/1.1/account/verify_credentials.json',
              method: 'GET',
            },
            { key: oauthToken, secret: oauthTokenSecret },
          ),
        ),
      },
    },
  );

  const json = await response.json();

  return json.id === id;
}

export default validateToken;
