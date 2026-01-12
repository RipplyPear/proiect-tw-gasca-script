// Modelul pentru utilizatori
const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

// Fiecare user are un rol: admin (organizator), reviewer sau author
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    // Rolul determina ce poate face userul in aplicatie
    role: {
        type: DataTypes.ENUM('admin', 'reviewer', 'author'),
        allowNull: false,
        defaultValue: 'author'
    }
});

module.exports = User;