// Modelul pentru recenzii
const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

// O recenzie reprezinta parerea unui reviewer despre un articol
const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Verdictul reviewerului: approved, changes_requested sau rejected
    verdict: {
        type: DataTypes.ENUM('approved', 'changes_requested', 'rejected'),
        allowNull: false,
        defaultValue: 'approved'
    },
    // Comentariile pentru autor
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Articolul recenzat
    paperId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Papers',
            key: 'id'
        }
    },
    // Cine face recenzia
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