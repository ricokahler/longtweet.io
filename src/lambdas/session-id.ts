import { DynamoDB } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 404 };
  }
  const sessionId = uuid();

  const dynamodb = new DynamoDB();

  await new Promise((resolve, reject) => {
    dynamodb.putItem(
      {
        TableName: 'longtweet-login',
        Item: {
          session_id: {
            S: sessionId,
          },
          exp: {
            N: Math.floor((Date.now() + 2 * 1000 * 60) / 1000).toString(),
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
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': 'https://longtweet.io',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({ sessionId }),
  };
}

export { handler };
