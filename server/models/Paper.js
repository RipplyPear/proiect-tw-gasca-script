// Modelul pentru articole stiintifice
const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

// Un articol trece prin mai multe statusuri pana la decizia finala
const Paper = sequelize.define('Paper', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Rezumatul articolului
    abstract: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Link-ul catre versiunea curenta
    currentVersionLink: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Statusul in procesul de review:
    // PENDING - abia trimis, IN_REVIEW - la revieweri
    // NEEDS_REVISIONS - trebuie modificari, ACCEPTED/REJECTED - decizia finala
    status: {
        type: DataTypes.ENUM('PENDING', 'IN_REVIEW', 'NEEDS_REVISIONS', 'ACCEPTED', 'REJECTED'),
        defaultValue: 'PENDING',
        allowNull: false
    },
    // Istoricul versiunilor (JSON cu version, link, date)
    versionHistory: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    // Cine a scris articolul
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    // La ce conferinta a fost trimis
    conferenceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Conferences',
            key: 'id'
        }
    }
});

module.exports = Paper;