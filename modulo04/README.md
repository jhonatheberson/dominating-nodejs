# modulo04

## Banco não relacional

- usar o mongoDB
- usando docker
- mongoose
- performace

```
docker run --name mongodb -p 27017:27017 -d -t mongo
```

para ver se esta rodando o mongo, precisamos acessar o porta no navegado com seguinte comando:

```
http://localhost:27017/
```

se retorna este texto é porque esta certo, **It looks like you are trying to access MongoDB over HTTP on the native driver port.**

agora iremos iremos instalar cli para _mongodb_, mesma coisa do **sequelize**

```
yarn add mongoose
```

agora iremos fazer a configurações no _/src/database/index.js_

iremos usar para armazenar dados e precisa de performace

```
import Sequelize from 'sequelize';
import mongoose from 'mongoose';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

import databaseConfig from '../config/database';

const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init();
    this.mongo();
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

  mongo() {
    this.mongoConnection = mongoose.connect(
      'mongodb://localhost:27017/gobarber',
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: true,
      }
    );
  }
}

export default new Database();

```

usaremos o mongodb para fazer notificações

# Notificando novos agendamentos

precisamos ter cuidado com os schemas, precisamos ter estrategia

criei uma pasta de _schemas_ no seguinte diretorio e o arquivo _Notification.js_

**/src/app/schemas/Notification.js**

e o conteudo de schema é o seguinte:

```
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    user: {
      type: Number,
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', NotificationSchema);
```

agora iremos usar, em nosso controller que queremos notificar

em nosso caso o primeiro é _AppointmentController.js_

a primeira coisa é importar o schema de notification

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // pegando a paginação
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar
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
      return res.status(401).json({
        error: 'You can only create  appointments with providers',
      });
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
      return res.status(400).json({
        error: 'Appointment date is not available',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);

    const formattedDate = format(hourStart, "'dia' dd 'de' MMM', às' H:mm'h'", {
      locale: pt,
    }); // para dia 30 de agosto às 10:00h

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`, // `Novo agendamento de jhonat heberson para dia 30 de abril às 19:00h`
      user: provider_id,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
```

usamos _format_ para formatar a data

# listando notificações do usuário

a primeira coisa que fizemos foi criar a rota em **routes.js**

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
import NotificationController from './app/controllers/NotificationController';

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

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

module.exports = routes;

```

e criamos om controller para as notications **NotificationController.js**

que tem os metodos de index que vai listar

```
import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    /** Check if provider_id is a provider  */
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({
        error: 'Only provider can load notifications',
      });
    }

    const notification = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    return res.json(notification);
  }

  async update(req, res) {
    // const notification = await Notification.findById(req.params.id);

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true }, // qual o campo que vamos atualizar
      { new: true } // retorna a notificação atualizada
    );

    return res.json(notification);
  }
}

export default new NotificationController();

```

também já coloquei o metodo de ler a noticação, no caso update

# Cancelamento de agendamento

para isso iremos mecher no controller appointment

antes de tudo iremos criar a rota em **routes.js**

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
import NotificationController from './app/controllers/NotificationController';

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
routes.delete('/appointments/:id', AppointmentController.delete);

routes.get('/schedule', ScheduleController.index);

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

module.exports = routes;

```

acrescetando o rota _delete_

em seguida iremos em **AppointmentController.js**

iremos adicionar o metodo delete

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // pegando a paginação
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar
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
      return res.status(401).json({
        error: 'You can only create  appointments with providers',
      });
    }
    /**
     * check user is provider
     */

    if (provider_id === req.userId) {
      return res.status(401).json({ error: 'you not appointment for you' });
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
      return res.status(400).json({
        error: 'Appointment date is not available',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);

    const formattedDate = format(hourStart, "'dia' dd 'de' MMM', às' H:mm'h'", {
      locale: pt,
    }); // para dia 30 de agosto às 10:00h

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`, // `Novo agendamento de jhonat heberson para dia 30 de abril às 19:00h`
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You dont't have permission to concel this appointment.fail",
      });
    }

    // 16.20
    // datewithsub: 14:30h
    // now 16.30

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointment 2 hours in advance',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    return res.json(appointment);
  }
}

export default new AppointmentController();

```

# Notificação por email

- **nodemailer**
- mailtrap - dev
- aws ses - prod
- biblioteca para envio de email
- template engine | **Handlebars** https://handlebarsjs.com/guide/#nested-input-objects

```
yarn add nodemailer
```

instalamos as integrações **express-handlebars** e **nodemailer-express-handlebars** com:

```
yarn add express-handlebars nodemailer-express-handlebars
```

apos isso iremos criar um arquivo de configuração **/src/config/mail.js**

com o seguinte conteudo:

```
export default {
  host: 'smtp.mailtrap.io',
  port: '2525',
  secure: false, // ssl segurança
  auth: {
    user: 'ea32dc7705b10b',
    pass: '3f3ac8644a45a6',
  },
  default: {
    from: 'Equipe GoBarber <noreply@gobarber.com', // copia default
  },
};

// mailtrap = desenvolvimento
// aws ses = produção


```

agora vamos fazer uma pasta onde iremos enviar o e-mail:

vamos criar uma pasta **/src/lib**

todas as configurações de serviços sera ficado nessa pasta

a nesse exemplo criamos uma arquivo _Mail.js_

esse arquivo tera o seguinte conteudo:

```
import nodemailer from 'nodemailer';
import mailConfig from '../config/mail';

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null, // verifica se se o email tem metodo de authenticate
    });
  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();


```

e por fim iremos criar uma metodo para enviar no **AppointmentController.js**

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // pegando a paginação
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar
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
      return res.status(401).json({
        error: 'You can only create  appointments with providers',
      });
    }
    /**
     * check user is provider
     */

    if (provider_id === req.userId) {
      return res.status(401).json({ error: 'you not appointment for you' });
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
      return res.status(400).json({
        error: 'Appointment date is not available',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);

    const formattedDate = format(hourStart, "'dia' dd 'de' MMM', às' H:mm'h'", {
      locale: pt,
    }); // para dia 30 de agosto às 10:00h

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`, // `Novo agendamento de jhonat heberson para dia 30 de abril às 19:00h`
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);
    const provider = await User.findByPk(req.userId);

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You dont't have permission to concel this appointment.fail",
      });
    }

    // 16.20
    // datewithsub: 14:30h
    // now 16.30

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointment 2 hours in advance',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Mail.sendMail({
      to: `${provider.name} <${provider.email}>`,
      subject: 'Agendamento cancelado',
      text: 'você tem um novo cancelamento',
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();

```

# templates de email

usaremos os seguintes pacotes:

```
yarn add express-handlebars nodemailer-express-handlebars
```

e agora iremos criar a estrutas e organização dos templates

- **/src/views**
  - emails
    - layouts
      - default.hbs
    - partials
      - footer.hbs
    - cancellation.hbs

o **default.hbs** é o template do email padrão, ou seja todo email vai ter aquelas configurações, o que muda é o _body_ e _partials_

o **footer.hbs** é toda informação que é repetida no email, por exemplo assinatura, informações da empresa etc...

o arquivo que esta dentro de pasta **emails** que nesse exemplo é **cancellation.hbs** é o corpo do email, a informaçao que iremos colocar com as variaveis

agora iremos alterar o arquivo **Mail.js** para que ele possa usar o template:

```
import nodemailer from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import mailConfig from '../config/mail';

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null, // verifica se se o email tem metodo de authenticate
    });

    this.configureTemplates();
  }

  configureTemplates() {
    const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails'); // pegando o diretorio emails

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          layoutsDir: resolve(viewPath, 'layouts'),
          partialsDir: resolve(viewPath, 'partials'),
          defaultLayout: 'default',
          extname: '.hbs',
        }),
        viewPath,
        extName: '.hbs',
      })
    );
  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();

```

o conteudo do arquivo **default.hbs** ficou o seguinte:

```
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-heigth: 1.6; color: #222; max-width: 600px">
  {{{ body }}}
  {{> footer }}
</div>

```

o conteudo do arquivo **footer.hbs** ficou o seguinte:

```
<br />
Equipe GoBarber

```

o conteudo do arquivo **cancellation.hbs** ficou o seguinte:

```
<strong>Olá, {{ provider }}</strong>
<p>Houve um cancelamento de horário, confira os detalhes abaixo:</p>
<p>
  <strong> Cliente: </strong> {{ user }} <br />
  <strong> Data/hora: </strong> {{ date }} <br />
  <br />
  <small>
    O horário está disponível para novos agendamentos.
  </small>
</p>

```

agora vamos colocar para funcionar o template modificando o arquivo **AppointmentController.js**
para executar a função e passar os parametros

esse arquivo ficou assim:

```
import * as Yup from 'yup'; // library de validação
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query; // pegando a paginação
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'], // ordenar a busca por data
      attributes: ['id', 'date'],
      limit: 20, // limitando quando iŕa mostrar por consulta
      offset: (page - 1) * 20, // mostrando de onde voi começar
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
      return res.status(401).json({
        error: 'You can only create  appointments with providers',
      });
    }
    /**
     * check user is provider
     */

    if (provider_id === req.userId) {
      return res.status(401).json({ error: 'you not appointment for you' });
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
      return res.status(400).json({
        error: 'Appointment date is not available',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id: req.body.provider_id,
      date: hourStart, // o minuto e segundo vai ser zero zero
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);

    const formattedDate = format(hourStart, "'dia' dd 'de' MMM', às' H:mm'h'", {
      locale: pt,
    }); // para dia 30 de agosto às 10:00h

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`, // `Novo agendamento de jhonat heberson para dia 30 de abril às 19:00h`
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);
    const user = await User.findByPk(req.userId);
    const provider = await User.findByPk(appointment.provider_id);

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You dont't have permission to concel this appointment.fail",
      });
    }

    // 16.20
    // datewithsub: 14:30h
    // now 16.30

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointment 2 hours in advance',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();
    await Mail.sendMail({
      to: `${provider.name} <${provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: provider.name,
        user: user.name,
        date: format(appointment.date, "'dia' dd 'de' MMM', às' H:mm'h'", {
          locale: pt,
        }), // para dia 30 de agosto às 10:00h
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();

```

apenas tiramos o _text_ e inlcuimos o template dessa forma:

```
await Mail.sendMail({
      to: `${provider.name} <${provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: provider.name,
        user: user.name,
        date: format(appointment.date, "'dia' dd 'de' MMM', às' H:mm'h'", {
          locale: pt,
        }), // para dia 30 de agosto às 10:00h
      },
    });
```
