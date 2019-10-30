import awsServerlessExpress from 'aws-serverless-express';
import path from 'path';
import dotenv from 'dotenv';
import YAML from 'yamljs';

const env = process.env.NODE_ENV;
const lambda = !!process.env.LAMBDA_TASK_ROOT;

if (['dev'].includes(env)) {
  const config = YAML.load(path.join(__dirname, '.env.yml'));
  Object.assign(process.env, config[env]);
} else {
  dotenv.config();
}

import app from './src/app';

if (lambda) {
  const server = awsServerlessExpress.createServer(app);
  exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
  };
} else {
  app.listen(3333);
}
