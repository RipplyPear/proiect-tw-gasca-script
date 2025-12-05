// Routes for papers
const express = require('express');
const router = express.Router();
const { User, Conference, Paper, Review } = require('../models');

/**
 * GET all papers from the database.
 */
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

/**
 * GET a specific paper by id.
 */
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

/**
 * POST a new paper to the database.
 * Automatically allocates 2 random reviewers from the conference.
 */
router.post('/', async (request, response, next) => {
    try {
        const { conferenceId, authorId } = request.body;

        const conference = await Conference.findByPk(conferenceId, {
            include: [{ model: User, as: 'reviewers' }]
        });

        if (!conference) {
            return response.status(404).json({ error: 'Conference not found' });
        }

        const paper = await Paper.create({
            ...request.body,
            versionHistory: [{
                version: 1,
                link: request.body.currentVersionLink,
                date: new Date()
            }]
        });

        // Auto-allocate 2 reviewers
        const reviewers = conference.reviewers;
        if (reviewers.length < 2) {
            return response.status(400).json({ error: 'Not enough reviewers allocated to conference' });
        }

        // Select 2 random reviewers
        const shuffled = reviewers.sort(() => 0.5 - Math.random());
        const selectedReviewers = shuffled.slice(0, 2);

        // Create review entries
        for (const reviewer of selectedReviewers) {
            await Review.create({
                paperId: paper.id,
                reviewerId: reviewer.id,
                verdict: 'approved',
                comments: 'Pending review'
            });
        }

        // Update paper status
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

/**
 * PUT to update a paper.
 */
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

/**
 * PUT to upload a new version of a paper.
 */
router.put('/:id/version', async (request, response, next) => {
    try {
        const { versionLink } = request.body;
        const paper = await Paper.findByPk(request.params.id);

        if (!paper) {
            return response.sendStatus(404);
        }

        // Add to version history
        const history = paper.versionHistory || [];
        const newVersion = {
            version: history.length + 1,
            link: versionLink,
            date: new Date()
        };
        history.push(newVersion);

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

/**
 * DELETE a paper.
 */
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

/**
 * POST to create or update a review for a paper.
 * Automatically updates paper status based on all reviews.
 */
router.post('/:id/reviews', async (request, response, next) => {
    try {
        const { reviewerId, verdict, comments } = request.body;
        const paperId = request.params.id;

        // Check if review already exists
        let review = await Review.findOne({
            where: { paperId, reviewerId }
        });

        if (review) {
            // Update existing review
            await review.update({ verdict, comments });
        } else {
            // Create new review
            review = await Review.create({
                paperId,
                reviewerId,
                verdict,
                comments
            });
        }

        // Update paper status based on reviews
        const paper = await Paper.findByPk(paperId, {
            include: [{ model: Review, as: 'reviews' }]
        });

        const allReviews = paper.reviews;
        const approvedCount = allReviews.filter(r => r.verdict === 'approved').length;
        const rejectedCount = allReviews.filter(r => r.verdict === 'rejected').length;
        const changesCount = allReviews.filter(r => r.verdict === 'changes_requested').length;

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
