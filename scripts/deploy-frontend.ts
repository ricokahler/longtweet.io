import { S3, CloudFront } from 'aws-sdk';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import webpackConfig from '../webpack.config';
import bundleInitPostControls from '../helpers/bundle-init-post-controls';

const extensionMap: { [key: string]: string | undefined } = {
  js: 'text/javascript',
  html: 'text/html',
  css: 'text/css',
};

async function main() {
  const s3 = new S3({
    region: 'us-east-1',
  });

  console.log('Bundling…');
  // @ts-ignore
  const compiler = webpack(webpackConfig);

  const memFs = Object.assign(createFsFromVolume(new Volume()), {
    join: path.join.bind(path),
  });

  compiler.outputFileSystem = memFs;

  await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(stats.toString());
        return reject(err);
      } else {
        resolve();
      }
    });
  });

  const distDir = (await memFs.promises.readdir(
    path.resolve(__dirname, '../dist'),
  )) as string[];

  // ensure no folders
  for (const name of distDir) {
    const stats = await memFs.promises.stat(
      path.resolve(__dirname, `../dist/${name}`),
    );
    if (stats.isDirectory()) {
      throw new Error(`"${name}" was a directory.`);
    }
  }

  // bundle post controls
  const postControls = await bundleInitPostControls();

  console.log('Uploading to S3…');

  // upload to S3
  await Promise.all(
    distDir.map(async (name) => {
      console.time(name);
      if (typeof name !== 'string') {
        throw new Error('expected name to be string');
      }

      const buffer = (await memFs.promises.readFile(
        path.resolve(__dirname, `../dist/${name}`),
      )) as Buffer;

      const nameSplit = name.split('.');
      const extension = nameSplit[nameSplit.length - 1];
      const mimeType = extensionMap[extension];

      if (!mimeType) {
        throw new Error(`No matching mime type for "${name}"`);
      }

      await s3
        .upload({
          Bucket: 'longtweet.io',
          Key: name,
          ACL: 'public-read',
          ContentType: mimeType,
          Body: buffer,
        })
        .promise();

      console.timeEnd(name);
    }),
  );

  await s3
    .upload({
      Bucket: 'longtweet.io',
      Key: 'post.js',
      ACL: 'public-read',
      ContentType: 'text/javascript',
      Body: postControls,
    })
    .promise();

  console.log('Creating CloudFront invalidation…');
  const cloudFront = new CloudFront();
  const invalidationResult = await cloudFront
    .createInvalidation({
      DistributionId: process.env.DISTRIBUTION_ID!,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: distDir.length + 1,
          Items: [...distDir.map((dir) => `/${dir}`), '/post.js'],
        },
      },
    })
    .promise();

  const invalidationId = invalidationResult.Invalidation?.Id;
  if (!invalidationId) {
    throw new Error('no invalidation ID');
  }

  console.log('Waiting for invalidation completion (takes a bit)…');
  await cloudFront
    .waitFor('invalidationCompleted', {
      DistributionId: process.env.DISTRIBUTION_ID!,
      Id: invalidationId,
    })
    .promise();

  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
