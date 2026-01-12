// Modelul pentru conferinte
const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

// O conferinta are titlu, locatie, data si un organizator
const Conference = sequelize.define('Conference', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Data conferintei (doar ziua, fara ora)
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Cine a creat conferinta (trebuie sa fie admin)
    organizerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = Conference;