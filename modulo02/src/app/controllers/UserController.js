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
