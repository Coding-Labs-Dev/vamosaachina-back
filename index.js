import awsServerlessExpress from 'aws-serverless-express';

import './config';
import app from './src/app';

const lambda = !!process.env.LAMBDA_TASK_ROOT;

if (lambda) {
  const server = awsServerlessExpress.createServer(app);
  exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
  };
} else {
  app.listen(3333);
}
