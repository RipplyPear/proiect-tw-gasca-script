// Routes for conferences
const express = require('express');
const router = express.Router();
const { User, Conference, Paper, Review } = require('../models');

/**
 * GET all conferences from the database.
 */
router.get('/', async (request, response, next) => {
    try {
        const conferences = await Conference.findAll({
            include: [
                { model: User, as: 'organizer' },
                { model: User, as: 'reviewers' }
            ]
        });
        if (conferences.length > 0) {
            response.json(conferences);
        } else {
            response.sendStatus(204);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET a specific conference by id.
 */
router.get('/:id', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id, {
            include: [
                { model: User, as: 'organizer' },
                { model: User, as: 'reviewers' }
            ]
        });
        if (conference) {
            response.json(conference);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST a new conference to the database.
 * Only users with role 'admin' can create conferences.
 */
router.post('/', async (request, response, next) => {
    try {
        const { organizerId } = request.body;

        const organizer = await User.findByPk(organizerId);
        if (!organizer) {
            return response.status(404).json({ error: 'Organizer not found' });
        }

        if (organizer.role !== 'admin') {
            return response.status(403).json({ error: 'Only admins can create conferences' });
        }

        const conference = await Conference.create(request.body);
        response.status(201).location(conference.id).send();
    } catch (error) {
        next(error);
    }
});

/**
 * PUT to update a conference.
 */
router.put('/:id', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id);
        if (conference) {
            await conference.update(request.body);
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE a conference.
 */
router.delete('/:id', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id);
        if (conference) {
            await conference.destroy();
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST to allocate reviewers to a conference.
 */
router.post('/:id/reviewers', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id);
        if (conference) {
            const { reviewerIds } = request.body;

            const reviewers = await User.findAll({
                where: { id: reviewerIds }
            });

            const allAreReviewers = reviewers.every(user => user.role === 'reviewer');
            if (!allAreReviewers) {
                return response.status(400).json({ error: 'All users must have reviewer role' });
            }

            await conference.setReviewers(reviewers);
            response.json(reviewers);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET all papers for a conference (for organizer monitoring).
 */
router.get('/:id/papers', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id);
        if (conference) {
            const papers = await Paper.findAll({
                where: { conferenceId: request.params.id },
                include: [
                    { model: User, as: 'author' },
                    {
                        model: Review,
                        as: 'reviews',
                        include: [{ model: User, as: 'reviewer' }]
                    }
                ]
            });

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

/**
 * POST to register an author to a conference.
 */
router.post('/:id/register', async (request, response, next) => {
    try {
        const conference = await Conference.findByPk(request.params.id);
        if (conference) {
            const { userId } = request.body;
            const user = await User.findByPk(userId);

            if (user) {
                response.json({ message: 'User registered to conference', userId, conferenceId: conference.id });
            } else {
                response.sendStatus(404);
            }
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
