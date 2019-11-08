import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import routes from './routes';

import Authentication from './app/middleware/Authentication';

class App {
  constructor() {
    this.server = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(
      cors({
        origin: process.env.ORIGIN,
        credentials: true,
      })
    );
    this.server.use(cookieParser());
    this.server.use(express.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.server.use('/admin', Authentication);
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
