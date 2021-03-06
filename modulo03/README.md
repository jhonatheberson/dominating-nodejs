# modulo03

## Multer

- faz upload de arquivo isolado
- guarda "id" no banco de dados
- envia o arquivo antes do json
- mult format data

```
yarn add multer
```

em seguida voi criar um diretoria para salvar os arquivos

```
./temp/uploads
```

em seguida irei criar um arquivo de configuração do multer no seguinte diretorio

```
./src/config/multer.js
```

esse arquivo tem o seguinte conteudo

```
import multer from 'multer';
import crypto from 'crypto';

import { extname, resolve } from 'path';

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      // controle da imagem como sera salvo
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);

        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }), // onde vai ser guardado, exemplo aws S3
};


```

e por fim importa no _./src/routes.js_ e crio as rotas

```
import { Router } from "express";
import multer from "multer"; // importando o multer
import multerConfig from "./config/multer"; //importando configuração do multer

import UserController from "./app/controllers/UserController";
import SessionController from "./app/controllers/SessionController";

import authMiddleware from "./app/middleware/auth";

const routes = new Router();
const upload = multer(multerConfig);

routes.post("/users", UserController.store);
routes.post("/sessions", SessionController.store);

// esse middleware so é executado apos ele ser declarado.
// logo as rotas posts acima não é executado esse middleware
routes.use(authMiddleware); // middleware global de auth
routes.put("/users", UserController.update);

routes.post("/files", upload.single("file"), (req, res) => {
  return res.json({ ok: true });
});

module.exports = routes;

```

agora iremos melhorar essa logica de files

primeira coisa é criar um controller _FileController.js_

```
class FileController {
  async store(req, res) {
    return res.json(req.file);
  }
}

export default new FileController();

```

depois altera o routes.js

```
import { Router } from 'express';
import multer from 'multer'; // importando o multer
import multerConfig from './config/multer'; // importando configuração do multer

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController'

import authMiddleware from './app/middleware/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// esse middleware so é executado apos ele ser declarado.
// logo as rotas posts acima não é executado esse middleware
routes.use(authMiddleware); // middleware global de auth
routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

module.exports = routes;

```

agora iremos criar migrations para criar uma tabela de files para guardar o 'id'

rodamos o seguinte comandos:

```
yarn sequelize migration:create --name=create-files
```

irar criar um arquivo de migração

com seguinte conteudo:

```
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false, // não permite nulo
        autoIncrement: true, // autoincrementa o valor do interger
        primaryKey: true, // é chave primaria
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // não pode ter email repetidos
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('files');
  },
};

```

e rodamos a migração para criar a migração no banco

```
yarn sequelize db:migrate
```

agora vamos criar nosso model _models/File.js_:

```
import Sequelize, { Model } from 'sequelize';

class File extends Model {
  // aqui declaro os campos da migração
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;

```

agora vamos importar nosso models no _index.js_

```
import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';

import databaseConfig from '../config/database';

const models = [User, File];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models.map((model) => model.init(this.connection));
  }
}

export default new Database();

```

e por fim importar no _FileController.js_ para usalo, assim criando nosso models no banco:

```

import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });

    return res.json(file);
  }
}

export default new FileController();

```

vamos criar um relacionamento entre as tabelas user e file

como sabemos não devemos alterar as migrations, para alterar algo no banco de dados precisamos criar uma nova migrations, porque o _migrations-users_ foi antes de _migrations-files_

logo iremos criar uma nova migrations bem descritiva:

```
yarn sequelize migration:create --name=add-avatar-field-to-users
```

e nossa arquivo de migração ficou assim:

```
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'avatar_id', {
      type: Sequelize.INTEGER,
      references: { model: 'files', key: 'id' }, // adiciona chave entrangeira no tabela users, referenciando o tabela "files", coluna "id"
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'avatar_id');
  },
};

```

aplicando a migrations:

```
yarn sequelize db:migrate
```

no models de user, precisamos alterar algumas coisa lá, para a associação seja bem feita e não tenha problemas futuros

```
static associate(models) {
    // fazendo o realacionamento no tabela em todos os models
    this.belongsTo(models.File, { foreignKey: 'avatar_id' });
    // BelongsTo = pertence a File esta na tabela de User
    // HasOne  = Users estaria na tabela de arquivo
    // HasMany =  id do users em varios registro em tabelas
  }
```

e vamos executar os esse metodo incluind no _index.js_:

```
import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';

import databaseConfig from '../config/database';

const models = [User, File];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map((model) => model.init(this.connection))
      .map((model) => User.associate && User.associate(this.connection.models));
    // so executa se a metodo existir "User.associate && User.associate"
  }
}

export default new Database();

```

agora vamos criar um rota para listar todos os providers

para isso criei om novo controller porque se trata de uma nova intidade, apesar que ja temos para listar os usuarios

```
import { User } from '../models/User';
import { File } from '../models/File';

class ProviderController {
  async index(res, req) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar', //não consegue fazer funciona 'as'
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res(providers);
  }
}

export default new ProviderController();

```

e adicionar essa rota no arquivo _routes.js_

```
import { Router } from 'express';
import multer from 'multer'; // importando o multer
import multerConfig from './config/multer'; // importando configuração do multer

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';

import authMiddleware from './app/middleware/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// esse middleware so é executado apos ele ser declarado.
// logo as rotas posts acima não é executado esse middleware
routes.use(authMiddleware); // middleware global de auth
routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);

routes.post('/files', upload.single('file'), FileController.store);

module.exports = routes;

```

percebe se que no mdels, fiz alguam mehorias como _attributes_ e _includes_ na pesquisa com _where_

agora para poder abrir a imagem no browser precisamos altarer o _app.js_

```
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

```

incluiindo o midleware _files_ para poder que image possa abrir

```
import Sequelize, { Model } from 'sequelize';

class File extends Model {
  // aqui declaro os campos da migração
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL, // não exixte no banco de ados so no codigo
          get() {
            return `http://localhost:3333/files/${this.path}`; // para colocar variavel na string é outra aspas
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File; // exportando o models user

```

para funcionar o as precisamos colocar tambem no models _Users.js_

```
import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  // aqui declaro os campos da migração
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL, // VIRTUAL significa que ele não existe na base de dados, somente no codigo
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
    // é executado automaticamente
    this.addHook('beforeSave', async (user) => {
      // Hook: trecho de codigo que são acionados com as condições
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
      return this;
    });
  }

  static associate(models) {
    // fazendo o realacionamento no tabela em todos os models
    this.belongsTo(models.File, {
      foreignKey: 'avatar_id',
    });
    // HasOne  = Users estaria na tabela de arquivo
    // HasMany =  id do users em varios registro em tabelas
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User; // exportando o models user

```

# tabela de agendamentos

primeiramente irei criar o migrate chamado _appointments_
rodando o seguinte comando

```
yarn sequelize migration:create --name=create-appointments
```

apos isso irei criar minha migração

```
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false, // não permite nulo
        autoIncrement: true, // autoincrementa o valor do interger
        primaryKey: true, // é chave primaria
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' }, // adiciona chave entrangeira no tabela users, referenciando o tabela "files", coluna "id"
        onUpdate: 'CASCADE', // SE FOR ATUALIZADO, TODOS OS AGENDAMENTOS TAMBEM SÃO
        onDelete: 'SET NULL', // SE O USER FOR DELETADO, O AGENDAMENTO AINDA FICA
        allowNull: true,
      },
      provider_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' }, // adiciona chave entrangeira no tabela users, referenciando o tabela "files", coluna "id"
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      canceled_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('appointments');
  },
};

```

e agora aplicamos nossa migração:

```
yarn sequelize db:migrate
```

vamo criar nosso models de _appointments_

criando o arquivo _models/Appointments.js_ com seguinte conteudo

```
import Sequelize, { Model } from 'sequelize';

class Appointment extends Model {
  // aqui declaro os campos da migração
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
    this.belongsTo(models.User, { foreignKey: 'provider_id' });
  }
}

export default Appointment; // exportando o models user

```

agora iremos no _index.js_ e importar o models

```
import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map((model) => model.init(this.connection))
      .map(
        (model) =>
          Appointment.associate && Appointment.associate(this.connection.models) // iso faz que inclua o relacionamento no banco de a dodos
      )
      .map((model) => User.associate && User.associate(this.connection.models));
    // so executa se a metodo existir "User.associate && User.associate"
  }
}

export default new Database();

```

# date-fns

- bibilio teca que trata datas e horas

para instalar usaremos a ultima versão

```
yarn add date-fns@next
```

agora iremos implementar os metodos que vai validara as datas e tambem listar o appointments

editando o arquivo _AppointmentController.js_

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

class AppointmentController {
  async index(req, res) {
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          attributes: ['id', 'name'], // mostrar somente id e nome do User
          include: [
            {
              model: File,
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const scheme = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await scheme.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /** Check if provider_id is a provider  */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create  appointments with providers' });
    }
    /**
     * Check for past date
     */
    const hourStart = startOfHour(parseISO(date)); // se pega a hora, zera minutos e segundos

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitions' });
    }
    /**
     * check date availability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();

```

realizei dois cheks importantes _checkAvailability_ e _Check for past date_

um para não deixar agendar dois serviços no mesmo horario e verificar se a hora de agendamento, é antes do horario atual

# paginação

para colocar a paginação, iremos enviar o parametro query, page = 1, ou qualquer pagina

e iremos tratar isso no _AppointmentController.js_

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // pegando a paginação
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar a consulta
      include: [
        {
          model: User,
          attributes: ['id', 'name'], // mostrar somente id e nome do User
          include: [
            {
              model: File,
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const scheme = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await scheme.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /** Check if provider_id is a provider  */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create  appointments with providers' });
    }
    /**
     * Check for past date
     */
    const hourStart = startOfHour(parseISO(date)); // se pega a hora, zera minutos e segundos

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitions' });
    }
    /**
     * check date availability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();

```

apenas peguei a o parametro page

```
const { page = 1 } = req.query; // pegando a paginação
```

e limitei as consultas colocando _limit_ e _offset_

```
where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar a consulta
```

# listagem agenda de prestadores

para isso iremos crira outro controller devido se tratar de outro entidade, no caso para o baberiro en não para user comum **ScheduleController.js**

com seguinte conteudo

```
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: {
        id: req.userId,
        provider: true,
      },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: 'User is not a provider' });
    }

    const { date } = req.query;
    const parsedDate = parseISO(date);
    // 2020-08-30T00:00:00-03:00
    // 2020-08-30 00:00:00
    // 2020-08-30 23:59:59
    // iremos buscar todos os agendamentos entre essa datas, ou *between*
    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      order: ['date'],
    });

    if (!appointments) {
      return res.status(401).json({ error: 'Not apoointments for as date' });
    }

    return res.json(appointments);
  }
}

export default new ScheduleController();


```

e adicionar essa rota ao **routes.js**

```
import { Router } from 'express';
import multer from 'multer'; // importando o multer
import multerConfig from './config/multer'; // importando configuração do multer

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';

import authMiddleware from './app/middleware/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// esse middleware so é executado apos ele ser declarado.
// logo as rotas posts acima não é executado esse middleware
routes.use(authMiddleware); // middleware global de auth
routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);

routes.post('/appointments', AppointmentController.store);
routes.get('/appointments', AppointmentController.index);
routes.get('/schedule', ScheduleController.index);

routes.post('/files', upload.single('file'), FileController.store);

module.exports = routes;


```

é importante mencionar que usei o _beetween_ no banco para buscar os dados entre os intervalos de datas, no caso, entre o inicio do dia e fim do dia
