import fetch from 'node-fetch';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

interface Options extends RequestInit {
  key: string;
  secret: string;
  oauthToken: string;
  oauthTokenSecret: string;
  method: string;
}

async function fetchTwitter(
  url: string,
  {
    key,
    secret,
    oauthToken,
    oauthTokenSecret,
    headers,
    method,
    ...options
  }: Options,
) {
  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_BOT_API_KEY!,
      secret: process.env.TWITTER_BOT_API_KEY_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (base_string, key) =>
      crypto.createHmac('sha1', key).update(base_string).digest('base64'),
  });

  const response = await fetch(url, {
    method,
    // @ts-ignore
    headers: {
      ...headers,
      ...oauth.toHeader(
        oauth.authorize(
          { url, method },
          { key: oauthToken, secret: oauthTokenSecret },
        ),
      ),
    },
    ...options,
  });

  return response;
}

export default fetchTwitter;
