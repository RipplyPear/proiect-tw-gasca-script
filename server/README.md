# Platformă de conferințe

Platformă web pentru organizarea conferințelor științifice.

## Echipă - GașcaScript
- Mincinoiu Dragoș-Matei
- Mircea Ștefăniță-Leonard
- Mihăilescu Valter-Ioan

## Tehnologii
- React + Vite (front-end)
- Node.js + Express (back-end)
- Sequelize ORM
- SQLite (DB)
- GitHub (versionare)

## Structura proiectului
- client/ – Front-end React
- server/ – Back-end Express + Sequelize
- docs/ – Diagrame și documentație

## Setup local

### Front-end
cd client  
npm install  
npm run dev

### Back-end
cd server  
npm install  
npx sequelize-cli db:migrate  
node index.js

## Branching
- main
- develop
- feature/frontend-setup
- feature/backend-setup
- feature/docs