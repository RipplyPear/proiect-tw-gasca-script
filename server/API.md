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

## Exemple Utilizare

**Organizator - Creare conferință:**
```bash
POST /api/conferences
{"title": "Tech 2024", "location": "București", "date": "2024-06-15", "organizerId": 2}
```

**Organizator - Alocare revieweri:**
```bash
POST /api/conferences/1/reviewers
{"reviewerIds": [3, 4, 5]}
```

**Autor - Trimitere articol:**
```bash
POST /api/papers
{"title": "Titlu", "abstract": "...", "currentVersionLink": "v1.pdf", "authorId": 6, "conferenceId": 1}
```

**Reviewer - Trimitere review:**
```bash
POST /api/papers/1/reviews
{"reviewerId": 3, "verdict": "approved", "comments": "Excelent"}
```

**Autor - Versiune nouă:**
```bash
PUT /api/papers/1/version
{"versionLink": "v2.pdf"}
```

---

**Toate funcționalitățile sunt implementate și testate.**
