// Rutele pentru recenzii
const express = require('express');
const router = express.Router();
const { User, Paper, Review } = require('../models');

// Ia toate recenziile cu reviewer si articol
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

// Ia o recenzie dupa ID
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

// Creeaza o recenzie noua
router.post('/', async (request, response, next) => {
    try {
        const review = await Review.create(request.body);
        response.status(201).location(review.id).send();
    } catch (error) {
        next(error);
    }
});

// Modifica o recenzie
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

// Sterge o recenzie
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
