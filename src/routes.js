import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import TransactionController from './app/controllers/TransactionController';
import NotificationController from './app/controllers/NotificationController';
import UserController from './app/controllers/UserController';
import ClientController from './app/controllers/ClientController';
import AuthenticationController from './app/controllers/AuthenticationController';

const routes = new Router();

// Public
routes.get('/session', SessionController.store);
routes.post('/pay', TransactionController.store);
routes.post('/callback', NotificationController.store);
// Admin - Public
routes.post('/session/signin', AuthenticationController.store);
routes.get('/session/verify', AuthenticationController.verify);
routes.get('/session/refresh', AuthenticationController.refresh);
routes.get('/session/signout', AuthenticationController.destroy);
// routes.post('/user', UserController.store);

// Admin
routes.get('/admin/transactions', TransactionController.index);
routes.get('/admin/transactions/:id', TransactionController.show);
// Admin-Clients
routes.get('/admin/clients', ClientController.index);
routes.get('/admin/clients/:id', ClientController.show);

export default routes;
