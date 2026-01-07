const sequelize = require('../sequelize');
const User = require('./User');
const Conference = require('./Conference');
const Paper = require('./Paper');
const Review = require('./Review');

// Define entities relationship
User.hasMany(Conference, { foreignKey: 'organizerId', as: 'organizedConferences' });
Conference.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

User.hasMany(Paper, { foreignKey: 'authorId', as: 'papers' });
Paper.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Conference.hasMany(Paper, { foreignKey: 'conferenceId', as: 'papers' });
Paper.belongsTo(Conference, { foreignKey: 'conferenceId', as: 'conference' });

Paper.hasMany(Review, { foreignKey: 'paperId', as: 'reviews' });
Review.belongsTo(Paper, { foreignKey: 'paperId', as: 'paper' });

User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

// Many-to-many relationship for Conference-Reviewers
const ConferenceReviewer = sequelize.define('ConferenceReviewer', {
    conferenceId: {
        type: require('sequelize').DataTypes.INTEGER,
        references: {
            model: 'Conferences',
            key: 'id'
        }
    },
    reviewerId: {
        type: require('sequelize').DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    tableName: 'ConferenceReviewers'
});

Conference.belongsToMany(User, { through: ConferenceReviewer, foreignKey: 'conferenceId', as: 'reviewers' });
User.belongsToMany(Conference, { through: ConferenceReviewer, foreignKey: 'reviewerId', as: 'reviewingConferences' });

module.exports = {
    sequelize,
    User,
    Conference,
    Paper,
    Review,
    ConferenceReviewer
};
