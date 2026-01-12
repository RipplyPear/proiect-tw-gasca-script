// Fisierul principal al serverului Express
const express = require('express');
require("./models");
const cors = require('cors');
const sequelize = require('./sequelize');

// Importam rutele pentru fiecare entitate
const usersRoutes = require('./routes/users');
const conferencesRoutes = require('./routes/conferences');
const papersRoutes = require('./routes/papers');
const reviewsRoutes = require('./routes/reviews');

const application = express();
const port = process.env.PORT || 3000;

// Middleware-uri Express
// cors - permite cereri din alte domenii (pt frontend)
// urlencoded si json - parseaza body-ul cererilor
application.use(cors());
application.use(express.urlencoded({ extended: true }));
application.use(express.json());

// Legam rutele la endpoint-urile API
application.use('/api/users', usersRoutes);
application.use('/api/conferences', conferencesRoutes);
application.use('/api/papers', papersRoutes);
application.use('/api/reviews', reviewsRoutes);

// Middleware pentru tratarea erorilor (500)
application.use((error, request, response, next) => {
  console.error(`[EROARE]: ${error}`);
  response.status(500).json({ error: error.message });
});

// Pornim serverul doar dupa ce ne conectam la baza de date
// Tabelele sunt create de seed.js
sequelize.authenticate().then(() => {
  application.listen(port, () => {
    console.log(`Serverul ruleaza pe http://localhost:${port}`);
    console.log('Conexiune DB OK');
  });
}).catch(error => {
  console.error('Nu am putut porni serverul:', error);
});