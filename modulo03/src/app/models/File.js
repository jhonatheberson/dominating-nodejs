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

export default File; // exportando o models user
