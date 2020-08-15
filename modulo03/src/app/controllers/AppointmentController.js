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
