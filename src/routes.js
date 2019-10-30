import { Router } from 'express';

import SessionController from './app/controllers/SessionController';

const routes = new Router();

routes.get('/session', SessionController.create);

export default routes;
