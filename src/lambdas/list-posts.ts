import { DynamoDB } from 'aws-sdk';

async function handler(event: any) {
  const dynamodb = new DynamoDB();

  await new Promise((resolve, reject) => {
    dynamodb.query(
      {
        TableName: 'longtweet-posts',
        ExpressionAttributeValues: {
          ':user_id': {
            S: 'No One You Know',
          },
        },
        KeyConditionExpression: 'user_id = :user_id',
      },
      (err, resolve) => {},
    );
  });
}

export { handler };
