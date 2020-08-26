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
