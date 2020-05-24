# modulo02

## sucrase

- adionando nova forma de import

  ```
  const express = require('express');
  ```

  para isso acontecer precisamos adicionar um library

  ```
  yarn add sucrase -D
  ```

  pronto agora é so importar tudo assim.

  ```
  import express from 'express';
  ```

  vale ressaltar que isso ja é realizado no javascript, somente a versão do **node 12**, não consegue fazer isso.

  também posso mudar a forma de export

  de

  ```
  module.exports = new App().server;
  ```

  para

  ```
  export default new App().server;
  ```

  mas para isso funcionar precimos criar um arquivo na pasta raiz,

  **nodemon.js**

  com seguinte conteudo.

  ```
  {
  "execMap": {
    "js": "node -r sucrase/register"
  }
  }

  ```

  isso fara que execute o sucrase em todo arquivo js, que seja executado no node.

  porém o modo de debug não irá funcionar , para funcinar precisamos altera algumas mudanças no arquivo **package.json**

  colocando o seguinte script:

  ```
  "dev:debug": "nodemon --inspect src/server.js"
  ```

  e alterar o arquivo de configuração do debug do vcsode

  **.vscode/launch.json**

  para essa forma

  ```
    {
  // Use o IntelliSense para aprender sobre possíveis atributos.
  // Passe o mouse para ver as descrições dos atributos existentes.
  // Para obter mais informações, visite: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [

    {
      "type": "node",
      "request": "attach",
      "name": "Executar Programa",
      "restart": true,
      "protocol": "inspector"
    }
  ]
  }
  ```

## ESLint

- verifica a padronização do codigo

instala eslint como dependencia de desenvolvimento

```
yarn add eslint -D
```

inicia arquivo de configurações

```
yarn eslint --init
```

- To check syntax, find problems, and enforce code style
- JavaScript modules (import/export)
- None of these
- Yes
- Node - _barra de espaço seleciona_
- Use a popular style guide
- Airbnb: https://github.com/airbnb/javascript
- JavaScript

agora delete file package-loc.json - _arquivo do npm_

agora rodo `yarn` para ele instalar as dependencias no yarn

este é meu arqquivo .eslintrc.js

```
module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    camecase: 'off',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePatterns: 'next',
      },
    ],
  },
};


```

e este é meu settings.json do _vscode_

```
{
  // Define o tema do VSCode
  "workbench.colorTheme": "Shades of Purple",
  // Configura tamanho e família da fonte
  "editor.fontSize": 18,
  "editor.lineHeight": 24,
  "editor.fontFamily": "Fira Code",
  "editor.fontLigatures": true,
  "explorer.compactFolders": false,
  // Aplica linhas verticais para lembrar de quebrar linha em códigos muito grandes
  "editor.rulers": [80, 120],
  "editor.formatOnSave": false,
  "eslint.packageManager": "npm",
  "[javascript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[javascriptreact]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescriptreact]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[vue]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[html]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "files.associations": {
    ".sequelizerc": "javascript",
    ".stylelintrc": "json",
    ".prettierrc": "json"
  },

  "eslint.autoFixOnSave": true,
  "eslint.validate": [
    {
      "language": "vue",
      "autoFix": true
    },
    {
      "language": "html",
      "autoFix": true
    },
    {
      "language": "javascript",
      "autoFix": true
    },
    {
      "language": "javascriptreact",
      "autoFix": true
    },
    {
      "language": "typescriptreact",
      "autoFix": true
    },
    {
      "language": "typescript",
      "autoFix": true
    }
  ],
  "eslint.options": {
    "extensions": [".js", ".vue"]
  },

  "vetur.format.defaultFormatter.css": "none",
  "vetur.format.defaultFormatter.js": "none",
  "vetur.format.defaultFormatter.less": "none",
  "vetur.format.defaultFormatter.postcss": "none",
  "vetur.format.defaultFormatter.scss": "none",
  "vetur.format.defaultFormatter.stylus": "none",
  "vetur.format.defaultFormatter.ts": "none",
  // Aplica um sinal visual na esquerda da linha selecionada
  "editor.renderLineHighlight": "gutter",
  // Aumenta a fonte do terminal
  "terminal.integrated.fontSize": 14,
  // Define o tema dos ícones na sidebar
  "workbench.iconTheme": "material-icon-theme",
  "workbench.startupEditor": "newUntitledFile",
  "editor.tabSize": 2,
  "window.zoomLevel": 0,
  "extensions.ignoreRecommendations": true,
  "emmet.syntaxProfiles": {
    "javascript": "jsx"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "javascript.updateImportsOnFileMove.enabled": "never",
  "gitlens.codeLens.recentChange.enabled": false,
  "gitlens.codeLens.authors.enabled": false,
  "gitlens.codeLens.enabled": false,
  "breadcrumbs.enabled": true,
  "git.enableSmartCommit": true,
  "editor.parameterHints.enabled": false,
  "typescript.updateImportsOnFileMove.enabled": "never",
  "terminal.integrated.shell.osx": "/bin/zsh",
  "explorer.confirmDragAndDrop": false,
  "liveshare.featureSet": "insiders",
  "explorer.confirmDelete": false,
  "typescript.tsserver.log": "verbose",
  "javascript.suggest.autoImports": false,
  "typescript.suggest.autoImports": false,
  "workbench.activityBar.visible": true,
  "editor.formatOnPaste": true,
  "editor.formatOnSave": true,
  "gitlens.advanced.messages": {
    "suppressFileNotUnderSourceControlWarning": true
  },
  "[vue]": {
    "editor.defaultFormatter": "octref.vetur"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "python.pythonPath": "[/usr/bin/python3.8]",
    "python.linting.pycodestyleEnabled": true,
    "python.formatting.provider": "autopep8"
  },
  "pip-updater.AutoUpdate": true,
  "pythonIndent.useTabOnHangingIndent": true,
  "kite.showWelcomeNotificationOnStartup": false,
  "files.autoSave": "off",
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "sync.gist": "9ba3b9be7a96f61fbfd11ab79af21c12",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.suggestSelection": "first",
  "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
  "python.jediEnabled": false
}
```

## prettier

- deixar o codigo mais bonito, check tamanho muito grande

```
yarn add prettier eslint-config-prettier eslint-plugin-prettier -D
```

preciso agora criar um arquivo _.prettierrc_ para tirar os conflitos entre Prettier e ESLint

```
{
  "singleQuote": true,
  "trailingComma": "es5"
}
```

agora para _fix (corrigir arquivos)_ em todos os arquivos é rodar este comando:

**yarn eslint --fix [pasta] --ext [extensão do arquivo]**

exemplo

```
yarn eslint --fix src --ext .js
```

## plugin editorconfig vscode

- esse plugin deixa uma formatação igual a todos os editores

para isso precisamos gera um arquivo no diretorio do projeto _.editorconfig_

com este comteudo

```
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

```

## pastas padrão MVC

- src/

  - app.js
  - routes.js
  - server.js
  - app/
    - controllers/
    - models/
  - config/
    - database.js
  - database/
    - migrations/
    - seeds/

- .editorconfig
- .eslintrc.js
- .prettierc
- package.json
- nodemon.json

## sequelize

Documentação: https://sequelize.org/v5/

- sequelize é ORM

Abstração do banco de dados

Tabelas viram models

para instalar é so executar este comando:

```
yarn add sequelize
```

```
yarn add sequelize-cli -D
```

o primeiro passo é criar um arquivo _.sequelizerc_

com este conteudo :

```
const { resolve } = require('path');

module.exports = {
  config: resolve(__dirname, 'src', 'config', 'database.js'),
  'models-path': resolve(__dirname, 'src', 'app', 'model'),
  'migrations-path': resolve(__dirname, 'src', 'database', 'migrations'),
  'seeders-path': resolve(__dirname, 'src', 'database', 'seeds'),
};


```

esse arquivo especifica onde esta meus arquivos de configurações

em seguida iremos criar o arquivo _config/database.js_

para especificar como será o banco e qual banco será.

Para isso precisar colocar o conteudo desse arquivo assim:

```
module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: '1298',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredALL: true,
  },
};


```

Sequelize aceita varios banco (dialect):

https://sequelize.org/v5/manual/dialects.html

- MSSQL
- PostgreSQL
- SQLite
- MariaDB
- MySQL

```
yarn add pg pg-hstore
```

essas são dependencias para usar dialect portgres

## primeira migrations

- usando sequelize-cli

```
yarn sequelize migration:create --name=[nome do migration]
```

como no exemplo de cria user abaixo

```
yarn sequelize migration:create --name=create-users
```

agora você pode ver que criou um arquivo
na pasta _database/migrations/_

- Data-types: https://sequelize.org/v5/manual/data-types.html

- Validations: https://sequelize.org/v5/manual/models-definition.html#validations

abaixo mostro um exemplo de arquivo de migrations:

```
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // não pode ter email repetidos
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // setando valor padrão como "false"
        allowNull: false,
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
    return queryInterface.dropTable('users');
  },
};


```

apos criar arquivo de migração e certificar que existe um banco postgres rodando e criado.

agora é só aplicar a migração no banco com este comando:

```
yarn sequelize db:migrate
```

### tabela SequelizeMeta

- é a tabela que armazena as migrations realizadas no banco

#### comandos uteis:

- desfazer a ultima migração:

```
yarn sequelize db:migrate:undo
```

- desfazer todas as migrações:

```
yarn sequelize db:migrate:undo:all
```

## criando models

- models é para manipular os dados no banco

para criar o model, é necessario criar um arquivo \*src/app/models/[nome do models].js

por exemplo nesse caso abaixo criei o model _User.js_

import Sequelize, { Model } from 'sequelize';

```
class User extends Model {
  // aqui declaro os campos da migração
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );
  }
}

export default User; // exportando o models user
```

mas para isso funcionar precisamos criar _src/database/index.js_

esse arquivo informa os models que existe na minha aplicação

```
import Sequelize from 'sequelize';

import User from '../app/models/User';

import databaseConfig from '../config/database';

const models = [User];

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

também alterar o arquivo _src/routes.js_

```
import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Diego Fernandes',
    email: 'diego@rocketseat.com.br',
    password_hash: '12345678',
  });

  return res.json(user);
});

module.exports = routes;

```

## Criando Controller

- controller é metodo que irá manipular os dados e tratar, o que vai ser a funcionalidade.

primeiramente precisa criar o arquivo do Controlller

_src/app/controllers/[nome do controller].js_

em meu exemplo ficou assim:

_src/app/controllers/UserController.js_

e conteudo desse arquivo esta dessa forma:

```
import User from '../models/User';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } }); // verifica se ja existe esse email no banco

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // const user = await User.create(req.body); // "await" é para realizar as coisas assincronas
    const { id, name, email, provider } = await User.create(req.body); // "await" é para realizar as coisas assincronas

    // return res.json(user);
    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();

```

além disso para usar esse controler é necessario modificar o arquivo _src/routes.js_

ficando dessa forma:

```
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

```

## Gerando Hash de senha

- iremos criptografar a senha do user ou qualquer coisa.

para isso iremos usar o biblioteca **bcryptjs**

```
yarn add bcryptjs
```

para realizar as mudanças é necessario modificar o arquivo _src/app/models/User.js_

importanto o bcryptjs e tratando a informação

o arquivo _User.js_ ficou dessa forma.

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
}

export default User; // exportando o models user


```
