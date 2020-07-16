import { DynamoDB } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';

interface TokenPayload {
  exp: number;
  iat: number;
  user: string;
  handle: string;
}

async function validateToken(event: LambdaEvent): Promise<TokenPayload | null> {
  const match = /bearer\s*(.*)/i.exec(event.headers.Authorization || '');
  if (!match) {
    return null;
  }
  const token = match[1].trim();

  const dynamodb = new DynamoDB();

  const [, encodedPayload] = token.split('.');
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  const { user, exp } = payload as TokenPayload;

  if (Date.now() >= exp * 1000) {
    return null;
  }

  const results = await dynamodb
    .query({
      ExpressionAttributeValues: {
        ':user_id': {
          S: user.toString(),
        },
      },
      KeyConditionExpression: 'user_id = :user_id',
      TableName: 'longtweet-users',
      IndexName: 'user_id-index',
    })
    .promise();

  const items = (results.Items || [])
    .map((item) => {
      const userId = item.user_id.S || '';
      const oauthToken = item.oauth_token.S;
      const oauthTokenSecret = item.oauth_token_secret.S;
      const signature = item.signature.S;

      if (!oauthToken || !oauthTokenSecret || !signature || !userId) {
        return null;
      }

      return { userId, oauthToken, oauthTokenSecret, signature };
    })
    .filter(<T>(t: T): t is NonNullable<T> => Boolean(t));

  const validToken = (() => {
    for (const { signature, oauthToken, oauthTokenSecret } of items) {
      try {
        const payload = jwt.verify(token, signature);
        if (typeof payload !== 'object') {
          throw new Error('Expected token payload to be an object');
        }

        return {
          oauthToken,
          oauthTokenSecret,
        };
      } catch {
        // jwt.verify throws if invalid
      }
    }

    return null;
  })();

  if (!validToken) {
    return null;
  }

  const { oauthToken, oauthTokenSecret } = validToken;

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

  if (json.id_str !== user) {
    return null;
  }

  return payload;
}

export default validateToken;
