# Documentație API - Platformă Conferințe

**Server:** `http://localhost:3000/api`  
**Bază de date:** SQLite

## Roluri

| Rol | Descriere |
|-----|-----------|
| `admin` | Organizator - creează conferințe, alocă revieweri |
| `reviewer` | Reviewer - evaluează articole, dă feedback |
| `author` | Autor - trimite articole, încarcă versiuni noi |

---

## Utilizatori `/api/users`

| Metodă | Endpoint | Descriere | Body |
|--------|----------|-----------|------|
| GET | `/` | Lista utilizatori | - |
| GET | `/:id` | Utilizator specific | - |
| POST | `/` | Creează utilizator | `{name, email, role}` |
| PUT | `/:id` | Actualizează utilizator | - |
| DELETE | `/:id` | Șterge utilizator | - |
| GET | `/:id/papers` | Articole alocate reviewer-ului | - |

---

## Conferințe `/api/conferences`

| Metodă | Endpoint | Descriere | Body |
|--------|----------|-----------|------|
| GET | `/` | Lista conferințe | - |
| GET | `/:id` | Conferință specifică | - |
| POST | `/` | Creează conferință (doar admin) | `{title, location, date, organizerId}` |
| POST | `/:id/reviewers` | Alocă revieweri | `{reviewerIds: [3,4,5]}` |
| GET | `/:id/papers` | Articole conferință (monitorizare) | - |
| POST | `/:id/register` | Înregistrare autor | `{userId}` |

---

## Articole `/api/papers`

| Metodă | Endpoint | Descriere | Body |
|--------|----------|-----------|------|
| GET | `/` | Lista articole | - |
| GET | `/:id` | Articol specific (cu reviews) | - |
| POST | `/` | Trimite articol + **alocare auto 2 revieweri** | `{title, abstract, currentVersionLink, authorId, conferenceId}` |
| PUT | `/:id` | Actualizează articol | - |
| PUT | `/:id/version` | Încarcă versiune nouă | `{versionLink}` |
| DELETE | `/:id` | Șterge articol | - |
| POST | `/:id/reviews` | Trimite review + **update auto status** | `{reviewerId, verdict, comments}` |

### Funcții Automate

**La trimitere articol (`POST /papers`):**
- Selectează random 2 revieweri din conferință
- Creează review-uri pentru ambii
- Setează status `IN_REVIEW`

**La versiune nouă (`PUT /papers/:id/version`):**
- Adaugă în `versionHistory`
- Resetează status la `IN_REVIEW`

**La trimitere review (`POST /papers/:id/reviews`):**
- Actualizează automat status articol:
  - Oricare `rejected` → `REJECTED`
  - Toate `approved` (≥2) → `ACCEPTED`
  - Oricare `changes_requested` → `NEEDS_REVISIONS`

**Opțiuni verdict:** `approved`, `changes_requested`, `rejected`

---

## Reviews `/api/reviews`

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/` | Lista reviews | 
| GET | `/:id` | Review specific |
| PUT | `/:id` | Actualizează review |
| DELETE | `/:id` | Șterge review |

---

## Flow Status Articole

```
PENDING → IN_REVIEW → ACCEPTED
                   ├→ REJECTED
                   └→ NEEDS_REVISIONS → (versiune nouă) → IN_REVIEW
```

---

## Pornire și Testare

```bash
# Pornire server
cd server
npm install
node index.js

# Populare date test
node seed.js
```

**Date test create:**
- 6 utilizatori (organizator ID 2, revieweri ID 3-5, autor ID 6)
- 1 conferință cu revieweri alocați
- 2 articole cu revieweri auto-alocați

**Testare:**
```bash
# Vezi utilizatori
curl http://localhost:3000/api/users

# Monitorizare articole conferință
curl http://localhost:3000/api/conferences/1/papers

# Detalii articol cu reviews
curl http://localhost:3000/api/papers/1
```

---

## Exemple Postman - Toate Endpoint-urile

> **Server URL:** `http://localhost:3000`  
> **În Postman:** Body → raw → JSON

---

### 📁 UTILIZATORI `/api/users`

**GET - Vezi toți utilizatorii:**
```
GET http://localhost:3000/api/users
Body: niciunul
```

**GET - Vezi utilizator specific:**
```
GET http://localhost:3000/api/users/1
Body: niciunul
```

**POST - Creează utilizator:**
```
POST http://localhost:3000/api/users
```
```json
{
  "name": "Ion Popescu",
  "email": "ion@example.com",
  "role": "author"
}
```
> Roluri posibile: `admin`, `reviewer`, `author`

**PUT - Actualizează utilizator:**
```
PUT http://localhost:3000/api/users/1
```
```json
{
  "name": "Ion Popescu Modificat",
  "email": "ion_nou@example.com",
  "role": "reviewer"
}
```

**DELETE - Șterge utilizator:**
```
DELETE http://localhost:3000/api/users/1
Body: niciunul
```

**GET - Articole alocate reviewer-ului:**
```
GET http://localhost:3000/api/users/3/papers
Body: niciunul
```

---

### 📁 CONFERINȚE `/api/conferences`

**GET - Vezi toate conferințele:**
```
GET http://localhost:3000/api/conferences
Body: niciunul
```

**GET - Vezi conferință specifică:**
```
GET http://localhost:3000/api/conferences/1
Body: niciunul
```

**POST - Creează conferință (doar admin):**
```
POST http://localhost:3000/api/conferences
```
```json
{
  "title": "Tech Conference 2024",
  "location": "București",
  "date": "2024-06-15",
  "organizerId": 2
}
```

**POST - Alocă revieweri la conferință:**
```
POST http://localhost:3000/api/conferences/1/reviewers
```
```json
{
  "reviewerIds": [3, 4, 5]
}
```

**GET - Articole conferință (monitorizare):**
```
GET http://localhost:3000/api/conferences/1/papers
Body: niciunul
```

**POST - Înregistrare autor la conferință:**
```
POST http://localhost:3000/api/conferences/1/register
```
```json
{
  "userId": 6
}
```

---

### 📁 ARTICOLE `/api/papers`

**GET - Vezi toate articolele:**
```
GET http://localhost:3000/api/papers
Body: niciunul
```

**GET - Vezi articol specific (cu reviews):**
```
GET http://localhost:3000/api/papers/1
Body: niciunul
```

**POST - Trimite articol (alocă auto 2 revieweri):**
```
POST http://localhost:3000/api/papers
```
```json
{
  "title": "Machine Learning în IoT",
  "abstract": "Acest articol analizează aplicațiile ML în dispozitivele IoT...",
  "currentVersionLink": "paper_v1.pdf",
  "authorId": 6,
  "conferenceId": 1
}
```

**PUT - Actualizează articol:**
```
PUT http://localhost:3000/api/papers/1
```
```json
{
  "title": "Titlu Nou",
  "abstract": "Abstract modificat..."
}
```

**PUT - Încarcă versiune nouă:**
```
PUT http://localhost:3000/api/papers/1/version
```
```json
{
  "versionLink": "paper_v2.pdf"
}
```

**DELETE - Șterge articol:**
```
DELETE http://localhost:3000/api/papers/1
Body: niciunul
```

**POST - Trimite review (update auto status):**
```
POST http://localhost:3000/api/papers/1/reviews
```
```json
{
  "reviewerId": 3,
  "verdict": "approved",
  "comments": "Articol bine structurat și documentat!"
}
```
> Verdict posibil: `approved`, `changes_requested`, `rejected`

---

### 📁 REVIEWS `/api/reviews`

**GET - Vezi toate review-urile:**
```
GET http://localhost:3000/api/reviews
Body: niciunul
```

**GET - Vezi review specific:**
```
GET http://localhost:3000/api/reviews/1
Body: niciunul
```

**PUT - Actualizează review:**
```
PUT http://localhost:3000/api/reviews/1
```
```json
{
  "verdict": "changes_requested",
  "comments": "Necesită revizuiri la secțiunea 3"
}
```

**DELETE - Șterge review:**
```
DELETE http://localhost:3000/api/reviews/1
Body: niciunul
```

---

## Flow Testare Complet

1. **Creează utilizatori** (admin, revieweri, autor)
2. **Admin creează conferință** cu `organizerId`
3. **Admin alocă revieweri** la conferință
4. **Autor trimite articol** → se alocă auto 2 revieweri
5. **Reviewerii trimit review-uri** → status se actualizează auto
6. **Dacă needs_revisions** → autor încarcă versiune nouă

---

**Toate funcționalitățile sunt implementate și testate.**
