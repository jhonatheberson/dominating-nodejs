import { Router } from 'express';
// import User from './app/models/User';

import UserController from './app/controllers/UserController';

const routes = new Router();

routes.post('/users', UserController.store);

// routes.get('/', async (req, res) => {
//   const user = await User.create({
//     name: 'Diego Fernandes',
//     email: 'diego@rocketseat.com.br',
//     password_hash: '12345678',
//   });

//   return res.json(user);
// });

module.exports = routes;
