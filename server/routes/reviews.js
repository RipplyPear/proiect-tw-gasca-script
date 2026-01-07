// Routes for reviews
const express = require('express');
const router = express.Router();
const { User, Paper, Review } = require('../models');

/**
 * GET all reviews from the database.
 */
router.get('/', async (request, response, next) => {
    try {
        const reviews = await Review.findAll({
            include: [
                { model: User, as: 'reviewer' },
                { model: Paper, as: 'paper' }
            ]
        });
        if (reviews.length > 0) {
            response.json(reviews);
        } else {
            response.sendStatus(204);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET a specific review by id.
 */
router.get('/:id', async (request, response, next) => {
    try {
        const review = await Review.findByPk(request.params.id, {
            include: [
                { model: User, as: 'reviewer' },
                { model: Paper, as: 'paper' }
            ]
        });
        if (review) {
            response.json(review);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST a new review to the database.
 */
router.post('/', async (request, response, next) => {
    try {
        const review = await Review.create(request.body);
        response.status(201).location(review.id).send();
    } catch (error) {
        next(error);
    }
});

/**
 * PUT to update a review.
 */
router.put('/:id', async (request, response, next) => {
    try {
        const review = await Review.findByPk(request.params.id);
        if (review) {
            await review.update(request.body);
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE a review.
 */
router.delete('/:id', async (request, response, next) => {
    try {
        const review = await Review.findByPk(request.params.id);
        if (review) {
            await review.destroy();
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
