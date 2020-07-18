import fetchTwitter from '../helpers/fetch-twitter';
import fetch from 'node-fetch';

const handler: LambdaHandler = async (event) => {
  const likes = await (async () => {
    const searchParams = new URLSearchParams();
    searchParams.append('include_entities', 'false');
    searchParams.append('count', '200');

    const response = await fetchTwitter(
      `https://api.twitter.com/1.1/favorites/list.json?${searchParams.toString()}`,
      {
        method: 'GET',
        key: process.env.TWITTER_BOT_API_KEY!,
        secret: process.env.TWITTER_BOT_API_KEY_SECRET!,
        oauthToken: process.env.TWITTER_LONGTWEET_USER_TOKEN!,
        oauthTokenSecret: process.env.TWITTER_LONGTWEET_USER_TOKEN_SECRET!,
      },
    );

    const likes = (await response.json()) as Array<{ id_str: string }>;
    return likes;
  })();

  const likesLookup = likes
    .map((like) => like.id_str)
    .reduce((acc, next) => {
      acc[next] = true;
      return acc;
    }, {} as { [key: string]: boolean });

  const twitLongerTweets = await (async () => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', '"tl.gd"');
    searchParams.append('result_type', 'recent');
    searchParams.append('include_entities', 'false');
    searchParams.append('count', '200');

    const response = await fetch(
      `https://api.twitter.com/1.1/search/tweets.json?${searchParams.toString()}`,
      {
        headers: {
          authorization: `Bearer ${process.env.TWITTER_BOT_BEARER_TOKEN!}`,
        },
      },
    );

    const tweets = (await response.json()) as {
      statuses: Array<{
        id_str: string;
        text: string;
        retweeted_status?: any;
        in_reply_to_status_id_str?: any;
      }>;
    };
    return tweets;
  })();

  const unlikedTweetIds = twitLongerTweets.statuses
    // no retweets
    .filter((tweet) => !tweet.text.startsWith('RT @'))
    .filter((tweet) => !tweet.retweeted_status)
    // no replies
    .filter((tweet) => !tweet.in_reply_to_status_id_str)
    // not previously liked
    .filter((tweet) => !likesLookup[tweet.id_str])
    .map((tweet) => tweet.id_str);

  for (const id of unlikedTweetIds) {
    const searchParams = new URLSearchParams();
    searchParams.append('id', id);

    await fetchTwitter(
      `https://api.twitter.com/1.1/favorites/create.json?${searchParams.toString()}`,
      {
        method: 'POST',
        key: process.env.TWITTER_BOT_API_KEY!,
        secret: process.env.TWITTER_BOT_API_KEY_SECRET!,
        oauthToken: process.env.TWITTER_LONGTWEET_USER_TOKEN!,
        oauthTokenSecret: process.env.TWITTER_LONGTWEET_USER_TOKEN_SECRET!,
      },
    );
  }

  return {
    statusCode: 200,
  };
};

export { handler };
