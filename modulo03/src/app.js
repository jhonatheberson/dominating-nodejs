import express from 'express'; // sucrase faz isso
import routes from './routes';
import path from './path';

import './database';

class App {
  constructor() {
    // esse metodo é contrutor é chamado
    // automaticamente ao chamar a classe App
    this.server = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
  }
}

// module.exports = new App().server; //esportanto o class App, o server
export default new App().server; // sucrase faz isso
