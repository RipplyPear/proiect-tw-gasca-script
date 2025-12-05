// Routes for users
const express = require('express');
const router = express.Router();
const { User, Paper, Review } = require('../models');

/**
 * GET all users from the database.
 */
router.get('/', async (request, response, next) => {
    try {
        const users = await User.findAll();
        if (users.length > 0) {
            response.json(users);
        } else {
            response.sendStatus(204);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET a specific user by id.
 */
router.get('/:id', async (request, response, next) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            response.json(user);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST a new user to the database.
 */
router.post('/', async (request, response, next) => {
    try {
        const user = await User.create(request.body);
        response.status(201).location(user.id).send();
    } catch (error) {
        next(error);
    }
});

/**
 * PUT to update a user.
 */
router.put('/:id', async (request, response, next) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            await user.update(request.body);
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE a user.
 */
router.delete('/:id', async (request, response, next) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            await user.destroy();
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET all papers assigned to a reviewer.
 */
router.get('/:id/papers', async (request, response, next) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            const reviews = await Review.findAll({
                where: { reviewerId: request.params.id },
                include: [{
                    model: Paper,
                    as: 'paper',
                    include: [
                        { model: User, as: 'author' },
                        { model: require('../models').Conference, as: 'conference' }
                    ]
                }]
            });

            const papers = reviews.map(review => review.paper);
            if (papers.length > 0) {
                response.json(papers);
            } else {
                response.sendStatus(204);
            }
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
