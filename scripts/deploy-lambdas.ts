import { Lambda } from 'aws-sdk';
import JsZip from 'jszip';
import fs from 'fs';
import path from 'path';
import bundle from '../helpers/bundle';

async function updateLambda(filename: string) {
  const filenameSplit = filename.split('/');
  const lastSplit = filenameSplit[filenameSplit.length - 1];
  const [functionName] = lastSplit.split('.');
  console.time(functionName);

  const lambda = new Lambda({
    region: 'us-east-1',
  });

  console.log(`Bundling ${functionName}…`);
  const code = await bundle(filename);

  console.log(`Zipping ${functionName}…`);
  const zip = new JsZip();
  zip.file('index.js', code);
  const zipFile = await zip.generateAsync({ type: 'nodebuffer' });

  console.log(`Uploading ${functionName}…`);
  await lambda
    .updateFunctionCode({
      FunctionName: functionName,
      ZipFile: zipFile,
    })
    .promise();

  console.timeEnd(functionName);
}

async function main() {
  const lambdaDirContents = await fs.promises.readdir(
    path.resolve(__dirname, '../lambdas'),
  );

  const lambdaFilenames = (
    await Promise.all(
      lambdaDirContents.filter(async (name) => {
        const stats = await fs.promises.stat(
          path.resolve(__dirname, `../lambdas/${name}`),
        );
        return !stats.isDirectory();
      }),
    )
  ).map((name) => path.resolve(__dirname, `../lambdas/${name}`));

  await Promise.all(
    lambdaFilenames.map(async (filename) => updateLambda(filename)),
  );

  console.log('DONE!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
