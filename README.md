# hl7-message-parser

A TypeScript parser and REST API for extracting structured patient data from plain-text HL7-like messages. Focused on clean separation of concerns — extraction logic, API layer, and data persistence kept independent.

---

## What it does

Accepts a plain-text message in a fixed segment format, extracts patient name, date of birth, and admitting diagnosis, validates the fields, and returns structured JSON.

**Example input segment:**

```
PRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|
DET|1|I|^^MainDepartment^101^Room 1|Common Cold
```

**Output:**

```json
{
  "fullName": {
    "lastName": "Smith",
    "firstName": "John",
    "middleName": "A"
  },
  "dateOfBirth": "1980-01-01",
  "primaryCondition": "Common Cold"
}
```

The parser handles missing middle names, CRLF line endings, unknown segments in any position, and segments without a trailing pipe. Invalid or malformed input returns a descriptive error.

---

## Endpoints

| Method | Endpoint     | Description                                          |
| ------ | ------------ | ---------------------------------------------------- |
| POST   | `/api/parse` | Accepts a raw message string, returns extracted data |

### Example request

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "message": "MSG|^~\\&|SenderSystem|Location|ReceiverSystem|Location|20230502112233\nEVT|TYPE|20230502112233\nPRS|1|9876543210^^^Location^ID||Smith^John^A|||M|19800101|\nDET|1|I|^^MainDepartment^101^Room 1|Common Cold"
  }'
```

### Error responses

| Status | Cause                                          |
| ------ | ---------------------------------------------- |
| 400    | Missing or non-string `message` field          |
| 400    | Missing required segment (PRS or DET)          |
| 400    | Invalid field values (malformed name, bad DOB) |
| 500    | Unexpected internal error                      |

---

## Project structure

```
hl7-message-parser/
├── src/
│   ├── parser/
│   │   ├── messageParser.ts          # Core extraction and validation logic
│   │   └── __tests__/
│   │       └── messageParser.test.ts # Unit tests for the parser
│   ├── api/
│   │   ├── routes.ts                 # Express route handler
│   │   ├── messageRepository.ts      # Data persistence (file-based mock)
│   │   └── __tests__/
│   │       └── routes.test.ts        # Integration tests via Supertest
│   ├── db/
│   │   └── db.json                   # Mock database (JSON file)
│   ├── types.ts                      # Shared types and ParseError class
│   └── index.ts                      # Express app setup and entry point
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## Running locally

```bash
# Install dependencies
npm install

# Run in development
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## Tech stack

| Layer     | Technology           |
| --------- | -------------------- |
| Runtime   | Node.js + TypeScript |
| Framework | Express 5            |
| Testing   | Jest + Supertest     |

---

## Production architecture

For a production setup:

```
Client request
      │
      ▼
Cloud Load Balancer + Cloud Armor
      │   (WAF rules, rate limiting, DDoS protection)
      ▼
Cloud Run (containerised service)
      │   (scales to zero, regional or multi-region)
      ▼
Database layer
```

**Container delivery:** Docker image built and pushed to GCP Artifact Registry, tagged by commit SHA. Cloud Run pulls from there on deploy.

**Protection:** A GCP HTTP(S) Load Balancer sits in front of Cloud Run with Cloud Armor attached — WAF rules for OWASP top-10, rate limiting per IP, and geo-based restrictions if needed. Cloud Run itself would not be exposed publicly.

**Database:**

- **Regional** — Cloud SQL (Postgres). Simple, managed, fits most use cases. Good choice if the service is deployed to a single region.
- **Global** — Cloud Spanner. Horizontally scalable, multi-region with strong consistency. Worth the operational cost if the service needs to span regions or handle very high write throughput.

The current file-based mock (`db.json`) would be replaced with a connection pool to whichever database is chosen. The repository layer (`messageRepository.ts`) is the only file that needs to change — nothing else in the stack is coupled to the storage mechanism.
