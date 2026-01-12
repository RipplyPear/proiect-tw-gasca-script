// Configurare conexiune la baza de date SQLite
const path = require("path");
const { Sequelize } = require('sequelize');

// Cream instanta Sequelize pentru SQLite
// Fisierul database.sqlite e creat in folderul server
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, "database.sqlite"),
});

module.exports = sequelize;
