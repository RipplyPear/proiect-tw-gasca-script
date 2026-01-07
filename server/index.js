// Express Initialisation
const express = require('express');
const cors = require('cors');
const sequelize = require('./sequelize');

// Import route modules
const usersRoutes = require('./routes/users');
const conferencesRoutes = require('./routes/conferences');
const papersRoutes = require('./routes/papers');
const reviewsRoutes = require('./routes/reviews');

const application = express();
const port = process.env.PORT || 3000;

// Express middleware
application.use(cors());
application.use(express.urlencoded({ extended: true }));
application.use(express.json());

// Routes
application.use('/api/users', usersRoutes);
application.use('/api/conferences', conferencesRoutes);
application.use('/api/papers', papersRoutes);
application.use('/api/reviews', reviewsRoutes);

// Create a middleware to handle 500 status errors
application.use((error, request, response, next) => {
    console.error(`[ERROR]: ${error}`);
    response.status(500).json({ error: error.message });
});

/**
 * Sync database and start server.
 */
sequelize.sync({ alter: true }).then(() => {
    application.listen(port, () => {
        console.log(`The server is running on http://localhost:${port}`);
        console.log('Database synced successfully');
    });
}).catch(error => {
    console.error('Unable to start server:', error);
});
