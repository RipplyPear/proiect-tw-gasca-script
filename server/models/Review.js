const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    verdict: {
        type: DataTypes.ENUM('approved', 'changes_requested', 'rejected'),
        allowNull: false,
        defaultValue: 'approved'
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    paperId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Papers',
            key: 'id'
        }
    },
    reviewerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = Review;