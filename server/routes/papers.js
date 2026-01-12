// Rutele pentru articole
const express = require('express');
const router = express.Router();
const { User, Conference, Paper, Review } = require('../models');

// Ia toate articolele cu autor si conferinta
router.get('/', async (request, response, next) => {
    try {
        const papers = await Paper.findAll({
            include: [
                { model: User, as: 'author' },
                { model: Conference, as: 'conference' }
            ]
        });
        if (papers.length > 0) {
            response.json(papers);
        } else {
            response.sendStatus(204);
        }
    } catch (error) {
        next(error);
    }
});

// Ia un articol dupa ID cu toate detaliile
router.get('/:id', async (request, response, next) => {
    try {
        const paper = await Paper.findByPk(request.params.id, {
            include: [
                { model: User, as: 'author' },
                { model: Conference, as: 'conference' },
                {
                    model: Review,
                    as: 'reviews',
                    include: [{ model: User, as: 'reviewer' }]
                }
            ]
        });
        if (paper) {
            response.json(paper);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

// Trimite un articol nou
// Aloca automat 2 revieweri random din conferinta
router.post('/', async (request, response, next) => {
    try {
        const { conferenceId, authorId } = request.body;

        // Verificam conferinta si luam reviewerii
        const conference = await Conference.findByPk(conferenceId, {
            include: [{ model: User, as: 'reviewers' }]
        });

        if (!conference) {
            return response.status(404).json({ error: 'Conference not found' });
        }

        // Cream articolul cu prima versiune in istoric
        const paper = await Paper.create({
            ...request.body,
            versionHistory: [{
                version: 1,
                link: request.body.currentVersionLink,
                date: new Date()
            }]
        });

        // Alocam 2 revieweri random
        const reviewers = conference.reviewers;
        if (reviewers.length < 2) {
            return response.status(400).json({ error: 'Not enough reviewers allocated to conference' });
        }

        // Amestecam si luam primii 2
        const shuffled = reviewers.sort(() => 0.5 - Math.random());
        const selectedReviewers = shuffled.slice(0, 2);

        // Cream recenziile initiale
        for (const reviewer of selectedReviewers) {
            await Review.create({
                paperId: paper.id,
                reviewerId: reviewer.id,
                verdict: 'approved',
                comments: 'Pending review'
            });
        }

        // Trecem in IN_REVIEW
        await paper.update({ status: 'IN_REVIEW' });

        const updatedPaper = await Paper.findByPk(paper.id, {
            include: [{
                model: Review,
                as: 'reviews',
                include: [{ model: User, as: 'reviewer' }]
            }]
        });

        response.status(201).json(updatedPaper);
    } catch (error) {
        next(error);
    }
});

// Modifica un articol
router.put('/:id', async (request, response, next) => {
    try {
        const paper = await Paper.findByPk(request.params.id);
        if (paper) {
            await paper.update(request.body);
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

// Incarca o versiune noua a articolului
router.put('/:id/version', async (request, response, next) => {
    try {
        const { versionLink } = request.body;
        const paper = await Paper.findByPk(request.params.id);

        if (!paper) {
            return response.sendStatus(404);
        }

        // Adaugam in istoric
        const history = paper.versionHistory || [];
        const newVersion = {
            version: history.length + 1,
            link: versionLink,
            date: new Date()
        };
        history.push(newVersion);

        // Actualizam si resetam la IN_REVIEW
        await paper.update({
            currentVersionLink: versionLink,
            versionHistory: history,
            status: 'IN_REVIEW'
        });

        response.json(paper);
    } catch (error) {
        next(error);
    }
});

// Sterge un articol
router.delete('/:id', async (request, response, next) => {
    try {
        const paper = await Paper.findByPk(request.params.id);
        if (paper) {
            await paper.destroy();
            response.sendStatus(204);
        } else {
            response.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

// Trimite sau actualizeaza un review
// Updateaza automat statusul articolului
router.post('/:id/reviews', async (request, response, next) => {
    try {
        const { reviewerId, verdict, comments } = request.body;
        const paperId = request.params.id;

        // Verificam daca exista deja review
        let review = await Review.findOne({
            where: { paperId, reviewerId }
        });

        if (review) {
            await review.update({ verdict, comments });
        } else {
            review = await Review.create({
                paperId,
                reviewerId,
                verdict,
                comments
            });
        }

        // Actualizam statusul articolului pe baza review-urilor
        const paper = await Paper.findByPk(paperId, {
            include: [{ model: Review, as: 'reviews' }]
        });

        const allReviews = paper.reviews;
        const approvedCount = allReviews.filter(r => r.verdict === 'approved').length;
        const rejectedCount = allReviews.filter(r => r.verdict === 'rejected').length;
        const changesCount = allReviews.filter(r => r.verdict === 'changes_requested').length;

        // Logica: rejected > toti approved > cereri de modificari
        if (rejectedCount > 0) {
            await paper.update({ status: 'REJECTED' });
        } else if (approvedCount === allReviews.length && allReviews.length >= 2) {
            await paper.update({ status: 'ACCEPTED' });
        } else if (changesCount > 0) {
            await paper.update({ status: 'NEEDS_REVISIONS' });
        }

        response.status(201).json(review);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
