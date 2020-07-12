import { S3, DynamoDB, CloudFront } from 'aws-sdk';
import validateToken from '../helpers/validate-token';
import wrapLambda from '../helpers/wrap-lambda';

const handler: LambdaHandler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
    };
  }

  const tokenPayload = await validateToken(event);

  if (!tokenPayload) {
    return { statusCode: 401 };
  }
  const { user } = tokenPayload;

  const s3 = new S3();
  const dynamodb = new DynamoDB();
  const cloudFront = new CloudFront();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 404 };
  }

  const { id } = JSON.parse(event.body || '{}');

  const objectTaggingOutput = await new Promise<S3.GetObjectTaggingOutput | null>(
    (resolve) => {
      s3.getObjectTagging(
        {
          Bucket: 'longtweet.io',
          Key: id,
        },
        (err, result) => {
          if (err) {
            resolve(null);
          } else {
            resolve(result);
          }
        },
      );
    },
  );

  if (!objectTaggingOutput) {
    return { statusCode: 404 };
  }

  const tag = objectTaggingOutput.TagSet.find(({ Key }) => Key === 'user');
  if (!tag) {
    throw new Error('Expected tag');
  }

  if (tag.Value !== user.toString()) {
    return { statusCode: 403 };
  }

  await new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: 'longtweet.io',
        Key: id,
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

  await new Promise((resolve, reject) => {
    dynamodb.deleteItem(
      {
        TableName: 'longtweet-posts',
        Key: {
          post_id: {
            S: id,
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

  await new Promise((resolve, reject) => {
    cloudFront.createInvalidation(
      {
        DistributionId: process.env.DISTRIBUTION_ID!,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: 1,
            Items: [`/${id}`],
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

  return { statusCode: 204 };
};

const wrapped = wrapLambda(handler);
export { wrapped as handler };
