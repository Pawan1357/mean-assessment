# Assessment Backend (NestJS + MongoDB)

## Purpose

Versioned property underwriting API for the assessment.  
Focus areas: strict REST resources, strong server validation, optimistic locking, immutable history, and auditability.

## Current Architecture

- `src/app.module.ts`: app composition, config, Mongo connection.
- `src/properties`: version workflows, save/save-as, audit, persistence.
- `src/brokers`: broker controller/service + broker DTO/interface.
- `src/tenants`: tenant controller/service + tenant DTO/interface.
- `src/common`: exception model, response envelope, request/response logging.

Key design choice:

- Broker and tenant endpoints are split into dedicated modules for separation at API boundary.
- Version lifecycle and cross-aggregate business rules stay centralized in `PropertiesService` to keep invariants consistent.

## Behavior Implemented

- `Save` updates selected editable version only.
- `Save As` creates next semantic version (`1.1 -> 1.2`) using current form snapshot.
- Historical versions are read-only.
- Optimistic locking via `expectedRevision`.
- Soft delete for brokers and tenants.
- Vacant tenant row is system-managed and persisted.
- Field-level audit logs with old/new values, action, revision, actor.
- Generic success/error response envelope for all APIs.
- Incoming/outgoing API logging for debugging.

## API Summary

Base: `http://localhost:3000/api`

- `GET /properties/:propertyId/versions`
- `GET /properties/:propertyId/versions/:version`
- `PUT /properties/:propertyId/versions/:version`
- `POST /properties/:propertyId/versions/:version/save-as`
- `GET /properties/:propertyId/versions/:version/audit-logs`
- `POST /properties/:propertyId/versions/:version/brokers?expectedRevision={n}`
- `PUT /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
- `DELETE /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
- `POST /properties/:propertyId/versions/:version/tenants?expectedRevision={n}`
- `PUT /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
- `DELETE /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

Detailed examples: `../docs/API.md`  
Postman collection: `../docs/postman/FinalAssessment2.postman_collection.json`

## Local Run

1. Ensure MongoDB is running.
2. `npm install`
3. `npm run start:dev`

Defaults:

- `PORT=3000`
- `MONGODB_URI=mongodb://localhost:27017/assessment`

## Test and Coverage

- Unit tests with coverage: `npm test`
- E2E tests: `npm run test:e2e`
- Build: `npm run build`

Current backend unit test status in this workspace:

- Unit tests pass.
- Coverage is high (>90% statements/lines/functions), branch coverage lower in a few complex paths.

## Seed and Assumptions

- Startup seed creates `property-1` at version `1.1` when missing.
- Single-user assessment mode: `mock.user@assessment.local`.
- AuthN/AuthZ is out of scope.
- Backend is source of truth for validation and business rules.
