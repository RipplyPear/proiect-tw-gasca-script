// Seed script pentru populare baza de date
const { sequelize, User, Conference, Paper, Review } = require('./models');

async function seed() {
    try {
        console.log('=== Populare Baza de Date ===\n');

        // Șterge toate datele existente
        await sequelize.sync({ force: true });
        console.log('[OK] Baza de date resetata\n');

        // 1. Creează utilizatori
        console.log('1. Creez utilizatori...');
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@conf.com',
            role: 'admin'
        });

        const organizer = await User.create({
            name: 'Organizer User',
            email: 'organizer@conf.com',
            role: 'admin'
        });

        const reviewer1 = await User.create({
            name: 'Reviewer 1',
            email: 'reviewer1@conf.com',
            role: 'reviewer'
        });

        const reviewer2 = await User.create({
            name: 'Reviewer 2',
            email: 'reviewer2@conf.com',
            role: 'reviewer'
        });

        const reviewer3 = await User.create({
            name: 'Reviewer 3',
            email: 'reviewer3@conf.com',
            role: 'reviewer'
        });

        const author = await User.create({
            name: 'Author User',
            email: 'author@conf.com',
            role: 'author'
        });

        console.log('[OK] Utilizatori creati:', {
            admin: admin.id,
            organizer: organizer.id,
            reviewers: [reviewer1.id, reviewer2.id, reviewer3.id],
            author: author.id
        });
        console.log('');

        // 2. Creează conferință
        console.log('2. Creez conferință...');
        const conference = await Conference.create({
            title: 'Tech Conference 2024',
            location: 'București',
            date: '2024-06-15',
            organizerId: organizer.id
        });
        console.log('[OK] Conferinta creata:', conference.id);
        console.log('');

        // 3. Alocă revieweri la conferință
        console.log('3. Aloc revieweri la conferință...');
        await conference.addReviewers([reviewer1, reviewer2, reviewer3]);
        console.log('[OK] Revieweri alocati');
        console.log('');

        // 4. Creează articol 1
        console.log('4. Creez articol 1...');
        const paper1 = await Paper.create({
            title: 'Machine Learning in Healthcare',
            abstract: 'This paper explores ML algorithms in medical diagnosis',
            currentVersionLink: 'ml_healthcare_v1.pdf',
            authorId: author.id,
            conferenceId: conference.id,
            versionHistory: [{
                version: 1,
                link: 'ml_healthcare_v1.pdf',
                date: new Date()
            }]
        });

        // Alocă 2 revieweri random
        await Review.create({
            paperId: paper1.id,
            reviewerId: reviewer1.id,
            verdict: 'approved',
            comments: 'Pending review'
        });

        await Review.create({
            paperId: paper1.id,
            reviewerId: reviewer2.id,
            verdict: 'approved',
            comments: 'Pending review'
        });

        await paper1.update({ status: 'IN_REVIEW' });
        console.log('[OK] Articol 1 creat cu 2 revieweri alocati');
        console.log('');

        // 5. Creează articol 2
        console.log('5. Creez articol 2...');
        const paper2 = await Paper.create({
            title: 'Blockchain in Supply Chain',
            abstract: 'Analysis of blockchain applications',
            currentVersionLink: 'blockchain_v1.pdf',
            authorId: author.id,
            conferenceId: conference.id,
            versionHistory: [{
                version: 1,
                link: 'blockchain_v1.pdf',
                date: new Date()
            }]
        });

        await Review.create({
            paperId: paper2.id,
            reviewerId: reviewer2.id,
            verdict: 'approved',
            comments: 'Pending review'
        });

        await Review.create({
            paperId: paper2.id,
            reviewerId: reviewer3.id,
            verdict: 'approved',
            comments: 'Pending review'
        });

        await paper2.update({ status: 'IN_REVIEW' });
        console.log('[OK] Articol 2 creat cu 2 revieweri alocati');
        console.log('');

        // 6. Adaugă reviews
        console.log('6. Adaug reviews pentru articol 1...');
        const review1 = await Review.findOne({
            where: { paperId: paper1.id, reviewerId: reviewer1.id }
        });
        await review1.update({
            verdict: 'changes_requested',
            comments: 'Please add more details in methodology section'
        });

        const review2 = await Review.findOne({
            where: { paperId: paper1.id, reviewerId: reviewer2.id }
        });
        await review2.update({
            verdict: 'approved',
            comments: 'Good work, well structured'
        });

        // Update paper status
        await paper1.update({ status: 'NEEDS_REVISIONS' });
        console.log('[OK] Reviews adaugate, status articol: NEEDS_REVISIONS');
        console.log('');

        // 7. Adaugă versiune nouă
        console.log('7. Adaug versiune nouă pentru articol 1...');
        const history = paper1.versionHistory;
        history.push({
            version: 2,
            link: 'ml_healthcare_v2.pdf',
            date: new Date()
        });
        await paper1.update({
            currentVersionLink: 'ml_healthcare_v2.pdf',
            versionHistory: history,
            status: 'IN_REVIEW'
        });
        console.log('[OK] Versiune noua adaugata, status resetat la IN_REVIEW');
        console.log('');

        // Afișează rezumat
        console.log('=== REZUMAT ===\n');
        const users = await User.findAll();
        const conferences = await Conference.findAll();
        const papers = await Paper.findAll();
        const reviews = await Review.findAll();

        console.log(`[OK] ${users.length} utilizatori`);
        console.log(`[OK] ${conferences.length} conferinte`);
        console.log(`[OK] ${papers.length} articole`);
        console.log(`[OK] ${reviews.length} reviews`);
        console.log('');
        console.log('=== GATA! Baza de date populată cu succes! ===');
        console.log('Server: http://localhost:3000');
        console.log('');
        console.log('Utilizatori de test:');
        console.log(`  Organizer: ID ${organizer.id} (${organizer.email})`);
        console.log(`  Reviewers: ID ${reviewer1.id}, ${reviewer2.id}, ${reviewer3.id}`);
        console.log(`  Author: ID ${author.id} (${author.email})`);

        process.exit(0);
    } catch (error) {
        console.error('Eroare:', error);
        process.exit(1);
    }
}

seed();
