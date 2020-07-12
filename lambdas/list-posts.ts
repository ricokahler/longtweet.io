import { DynamoDB } from 'aws-sdk';
import wrapLambda from '../helpers/wrap-lambda';
import validateToken from '../helpers/validate-token';

const handler: LambdaHandler = async (event) => {
  const tokenPayload = await validateToken(event);
  if (!tokenPayload) {
    return { statusCode: 401 };
  }
  const { user } = tokenPayload;

  if (event.httpMethod !== 'GET') {
    return { statusCode: 404 };
  }

  const dynamodb = new DynamoDB();

  const result = await dynamodb
    .query({
      ExpressionAttributeValues: {
        ':user_id': {
          N: user.toString(),
        },
      },
      KeyConditionExpression: 'user_id = :user_id',
      TableName: 'longtweet-posts',
      IndexName: 'user_id-index',
    })
    .promise();

  const postIds = (result.Items || [])
    .map((item) => item.post_id.S)
    .filter(<T>(t: T): t is NonNullable<T> => Boolean(t));

  return {
    statusCode: 200,
    body: JSON.stringify(postIds),
  };
};

const wrapped = wrapLambda(handler);
export { wrapped as handler };
