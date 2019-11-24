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
    const whitelist = [
      'http://localhost:3000',
      'https://acupunturanachina.com.br',
      'https://admin.acupunturanachina.com.br',
      /\.pagseguro\.com.br$/,
    ];
    const corsOptions = {
      origin(origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    };

    this.server.use(cors(corsOptions));
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
