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