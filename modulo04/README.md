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
