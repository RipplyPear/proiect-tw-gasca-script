// Rutele pentru utilizatori
const express = require('express');
const router = express.Router();
const { User, Paper, Review } = require('../models');

// Ia toti utilizatorii din baza de date
router.get('/', async (request, response, next) => {
    try {
        const users = await User.findAll();
        if (users.length > 0) {
            response.json(users);
        } else {
            response.sendStatus(204); // Nu avem useri
        }
    } catch (error) {
        next(error);
    }
});

// Ia un user dupa ID
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

// Creeaza un user nou
router.post('/', async (request, response, next) => {
    try {
        const user = await User.create(request.body);
        response.status(201).location(user.id).send();
    } catch (error) {
        next(error);
    }
});

// Modifica un user existent
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

// Sterge un user
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

// Ia toate articolele alocate unui reviewer
// Folosit in dashboard-ul reviewerului
router.get('/:id/papers', async (request, response, next) => {
    try {
        const user = await User.findByPk(request.params.id);
        if (user) {
            // Gasim review-urile facute de acest user si includem articolele
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

            // Extragem doar articolele
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
