import { S3 } from 'aws-sdk';
import validateToken from '../helpers/validate-token';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Origin': 'https://longtweet.io',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
    };
  }

  if (!(await validateToken(event))) {
    return {
      statusCode: 401,
      headers: corsHeaders,
    };
  }

  const match = /bearer\s*(.*)/i.exec(event.headers.Authorization);
  if (!match) {
    return false;
  }
  const token = match[1];

  const [, encodedPayload] = token.split('.');
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  const { user } = payload;

  const s3 = new S3();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 404,
      headers: corsHeaders,
    };
  }

  const { id } = JSON.parse(event.body);

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
    return {
      statusCode: 404,
      headers: corsHeaders,
    };
  }

  const tag = objectTaggingOutput.TagSet.find(({ Key }) => Key === 'user');
  if (!tag) {
    throw new Error('Expected tag');
  }

  if (tag.Value !== user.toString()) {
    return {
      statusCode: 403,
      headers: corsHeaders,
    };
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

  return {
    statusCode: 204,
    headers: corsHeaders,
  };
}

export { handler };
