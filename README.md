# Assessment Backend (NestJS + MongoDB)

## 1) Purpose
This service implements the assessment backend for a versioned property underwriting workflow.

It is designed around:
- clean NestJS module/controller/service architecture
- strict REST resources
- optimistic locking (`revision`)
- immutable historical versions
- full audit/change logging
- server-side business rule enforcement

---

## 2) Deliverables Coverage (from `requirements.txt`)
Implemented in backend:
- API design for property, save, save-as, brokers, tenants
- validation and edge-case handling (server is source of truth)
- change history table with field-level old/new values and changed field count
- save and save-as behaviors for versioning
- tenant rules and vacant-row handling
- generic success/error response envelope

---

## 3) Tech Stack
- Node.js 20+
- NestJS 10
- MongoDB + Mongoose
- class-validator / class-transformer
- Jest

---

## 4) High-Level Architecture

### Modules
- `src/app.module.ts`: app composition and Mongo wiring
- `src/properties/properties.module.ts`: feature module

### Layers
- `controllers/`: HTTP interface only
- `services/`: business rules and workflows
- `repositories/`: database persistence operations
- `schemas/`: Mongo collections and indexes
- `dto/`: request validation contracts
- `common/`: interceptors, exception filter, response envelope

---

## 5) Core Business Rules
- Property address is read-only.
- Historical versions are not editable.
- Save updates currently selected version only.
- Save As creates a **new semantic version** (`1.1 -> 1.2`) and keeps previous versions historical.
- Save As accepts full form snapshot and clones that snapshot into new version (does not require saving current first).
- Optimistic locking required (`expectedRevision`).
- Tenant business rules:
  - total active tenant SF <= property building SF
  - lease start >= property start
  - lease end <= lease start + hold period
- Vacant row:
  - persisted in DB (`id = vacant-row`)
  - system-managed
  - cannot be directly updated/deleted
- Broker/tenant deletes are soft deletes.

---

## 6) API Response Contract

### Success
```json
{
  "success": true,
  "message": "Request processed successfully",
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-18T00:00:00.000Z",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Revision mismatch detected. Reload latest data.",
  "errorCode": "CONFLICT",
  "statusCode": 409,
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-18T00:00:00.000Z",
  "details": {}
}
```

---

## 7) REST API Documentation
Base URL: `http://localhost:3000/api`

### Version Endpoints
- `GET /properties/:propertyId/versions`
- `GET /properties/:propertyId/versions/:version`
- `PUT /properties/:propertyId/versions/:version`
- `POST /properties/:propertyId/versions/:version/save-as`
- `GET /properties/:propertyId/versions/:version/audit-logs`

### Broker Endpoints
- `POST /properties/:propertyId/versions/:version/brokers?expectedRevision={n}`
- `PUT /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
- `DELETE /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`

### Tenant Endpoints
- `POST /properties/:propertyId/versions/:version/tenants?expectedRevision={n}`
- `PUT /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
- `DELETE /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

---

## 8) Important Request Payloads

### Save Current Version
`PUT /properties/property-1/versions/1.1`
```json
{
  "expectedRevision": 2,
  "propertyDetails": { "...": "full object" },
  "underwritingInputs": { "...": "full object" },
  "brokers": [{ "id": "broker-1", "name": "...", "phone": "...", "email": "...", "company": "...", "isDeleted": false }],
  "tenants": [{ "id": "tenant-1", "tenantName": "...", "creditType": "...", "squareFeet": 12000, "rentPsf": 18, "annualEscalations": 5, "leaseStart": "2025-10-25", "leaseEnd": "2030-10-25", "leaseType": "NNN", "renew": "Yes", "downtimeMonths": 2, "tiPsf": 7, "lcPsf": 2.5, "isVacant": false, "isDeleted": false }]
}
```

### Save As (snapshot clone)
`POST /properties/property-1/versions/1.1/save-as`
```json
{
  "expectedRevision": 2,
  "propertyDetails": { "...": "full object" },
  "underwritingInputs": { "...": "full object" },
  "brokers": [{ "...": "..." }],
  "tenants": [{ "...": "..." }]
}
```

### Broker Create
```json
{
  "name": "Ashay Kandylia",
  "phone": "+1 (555) 867-5309",
  "email": "example@company.com",
  "company": "Agile Infoways"
}
```

### Tenant Create
```json
{
  "tenantName": "Grandma's Pizza",
  "creditType": "National",
  "squareFeet": 12000,
  "rentPsf": 18,
  "annualEscalations": 5,
  "leaseStart": "2025-10-25",
  "leaseEnd": "2030-10-25",
  "leaseType": "NNN",
  "renew": "Yes",
  "downtimeMonths": 2,
  "tiPsf": 7,
  "lcPsf": 2.5
}
```

---

## 9) Local Setup

### Prerequisites
- Node.js 20+
- MongoDB running locally or reachable URI

### Steps
1. `cp .env.example .env`
2. Set `MONGODB_URI` in `.env` if needed
3. `npm install`
4. `npm run start:dev`

Default server port: `3000`

### Environment Variables
- `MONGODB_URI` (default fallback in code: `mongodb://localhost:27017/assessment`)
- `PORT` (default: `3000`)

---

## 10) Seeding
On startup, if data does not exist, the app seeds:
- `propertyId = property-1`
- initial version `1.1`

---

## 11) Testing
- Unit tests + coverage: `npm test`
- e2e tests: `npm run test:e2e`

---

## 12) Logging / Debugging
Global interceptor and filter log:
- incoming request payload/context
- outgoing success payload
- outgoing error payload (code/message/details)

---

## 13) Assumptions
- Single-user assessment mode (`mock.user@assessment.local`)
- Authentication/authorization out of scope
- Backend is authoritative for all invariants and validation
- Frontend may add UX validation, but backend enforces final rules
