const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

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
    abstract: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    currentVersionLink: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'IN_REVIEW', 'NEEDS_REVISIONS', 'ACCEPTED', 'REJECTED'),
        defaultValue: 'PENDING',
        allowNull: false
    },
    versionHistory: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
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