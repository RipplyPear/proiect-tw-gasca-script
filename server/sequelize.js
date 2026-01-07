const path = require("path"); // Added by Matei
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, "database.sqlite"), // modified by Matei
});

module.exports = sequelize;
