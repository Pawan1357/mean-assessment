# Assessment Backend (NestJS + MongoDB)

## Overview
This backend implements the assessment requirements for a versioned property underwriting system.

Key capabilities:
- Versioned property records (`Save` vs `Save As`)
- Optimistic locking with `revision`
- Shared payload save for Property Details + Underwriting
- Tenant and broker CRUD with soft delete
- System-managed persisted vacant row
- Field-level audit logging (`oldValue`, `newValue`, `updatedBy`)
- Generic API success/error envelope
- Structured request/response debug logs

## Tech Stack
- NestJS 10
- Mongoose (MongoDB)
- class-validator / class-transformer
- Jest (unit + e2e)

## Project Structure
- `src/app.module.ts`: app composition
- `src/main.ts`: bootstrap, global pipes/interceptors/filters
- `src/common/`: shared exception/filter/interceptors/interfaces
- `src/properties/`: feature module
- `src/properties/controllers/`: REST endpoints
- `src/properties/services/`: business logic + seed
- `src/properties/repositories/`: db access
- `src/properties/schemas/`: mongoose schemas
- `src/properties/dto/`: input validation DTOs

## How It Works
1. **Save (`PUT /versions/:version`)**
- Updates the selected current version only.
- Requires full payload from both tabs.
- Increments `revision`.
- Does not create a new semantic version.

2. **Save As (`POST /versions/:version/save-as`)**
- Clones selected version to next semantic version (`1.1 -> 1.2`).
- Marks old latest version historical.
- New version starts with `revision = 0`.

3. **Historical versions**
- Read-only for mutations.

4. **Vacant row**
- Persisted by server during writes.
- `id = vacant-row`.
- Cannot be directly updated or deleted through tenant APIs.

5. **Audit logging**
- Each mutation writes an audit entry with changed fields and count.

## Generic Response Contract
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

## Debug Logging
Global logging writes:
- Incoming request: method, path, params, query, body
- Outgoing success: statusCode, durationMs, data
- Outgoing error: statusCode, errorCode, message, details

## Setup
### Prerequisites
- Node.js 20+
- npm
- MongoDB running locally (or accessible URI)

### Run
1. `cp .env.example .env`
2. `npm install`
3. `npm run start:dev`

Default base URL: `http://localhost:3000`

## Environment Variables
- `MONGODB_URI` (default fallback: `mongodb://localhost:27017/assessment`)
- `PORT` (default: `3000`)

## Seed Data
On startup, if missing, backend seeds:
- `propertyId = property-1`
- `version = 1.1`

## API Documentation
Base path: `/api/properties`

### Version APIs
1. `GET /:propertyId/versions`
2. `GET /:propertyId/versions/:version`
3. `PUT /:propertyId/versions/:version`
4. `POST /:propertyId/versions/:version/save-as`
5. `GET /:propertyId/versions/:version/audit-logs`

### Broker APIs
1. `POST /:propertyId/versions/:version/brokers?expectedRevision={n}`
2. `PUT /:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
3. `DELETE /:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`

### Tenant APIs
1. `POST /:propertyId/versions/:version/tenants?expectedRevision={n}`
2. `PUT /:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
3. `DELETE /:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

## Important Validation Rules
- `expectedRevision` required for write operations.
- Total active tenant square feet must be `<= property space`.
- Lease start must be `>= property start date`.
- Lease end must be `<= lease start + hold period`.
- Address is read-only on save.
- Historical versions cannot be mutated.
- `vacant-row` cannot be directly updated/deleted.
- Duplicate broker IDs or duplicate non-vacant tenant IDs are rejected.

## Postman Testing Flow
Use this order:
1. `GET versions`
2. `GET selected version`
3. `PUT save current version` (reuse returned `data.revision` next)
4. Broker create/update/delete
5. Tenant create/update/delete
6. `POST save-as`
7. `GET versions` (verify new semantic version)
8. `GET audit-logs`

## Tests
- Unit + coverage: `npm test`
- E2E: `npm run test:e2e`

## Assumptions
- Single user mode for assessment (`mock.user@assessment.local`)
- Authentication/authorization out of scope
- Strict REST resource endpoints
- Server is source of truth for business invariants
