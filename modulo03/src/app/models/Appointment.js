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
