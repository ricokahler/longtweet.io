import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';

interface TokenPayload {
  exp: number;
  iat: number;
  user: number;
  handle: string;
}

async function validateToken(event: LambdaEvent): Promise<TokenPayload | null> {
  const match = /bearer\s*(.*)/i.exec(event.headers.Authorization || '');
  if (!match) {
    return null;
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
  const tokenPayload = (() => {
    try {
      const payload = jwt.verify(token, signature);
      if (typeof payload !== 'object') {
        throw new Error('Expected token payload to be an object');
      }
      return payload as TokenPayload;
    } catch {
      return null;
    }
  })();

  if (!tokenPayload) {
    return null;
  }

  const { exp } = tokenPayload;
  if (Date.now() >= exp * 1000) {
    return null;
  }

  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_CONSUMER_KEY!,
      secret: process.env.TWITTER_CONSUMER_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (base_string, key) =>
      crypto.createHmac('sha1', key).update(base_string).digest('base64'),
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

  if (json.id !== id) {
    return null;
  }

  return payload;
}

export default validateToken;
