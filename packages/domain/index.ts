/**
 * @mindmitra/domain — the shared API contract, generated from the backend.
 *
 * DO NOT hand-edit schema.d.ts. Regenerate with:
 *     pnpm gen:types           (from the repo root)
 * which runs the FastAPI OpenAPI dump + openapi-typescript. CI fails on drift.
 *
 * `paths` / `operations` describe endpoints; `components["schemas"]` are the
 * DTOs. The `Schemas` alias and the named re-exports below are conveniences.
 */

export type { paths, components, operations } from "./schema";

import type { components } from "./schema";

export type Schemas = components["schemas"];

// Convenience aliases for the DTOs the clients use most.
export type ObservationSignals = Schemas["ObservationSignalsIn"];
export type ObservationResponse = Schemas["ObservationResponse"];
export type BaselineResponse = Schemas["BaselineResponse"];
export type SafetyCheckResponse = Schemas["SafetyCheckResponse"];
export type CheckResultOut = Schemas["CheckResultOut"];
export type SeedResponse = Schemas["SeedResponse"];
export type SeedScenario = Schemas["SeedScenario"];
export type PwmReadResponse = Schemas["PwmReadResponse"];
export type ProvenanceEnvelope = Schemas["ProvenanceEnvelope"];
export type ConsentGrantView = Schemas["ConsentGrantView"];

// Escalation: observation → baseline → alert → caregiver card
export type Alert = Schemas["Alert"];
export type CardFact = Schemas["CardFact"];
export type CardHypothesis = Schemas["CardHypothesis"];
export type CaregiverCard = Schemas["CaregiverCard"];
export type InjectDeclineResponse = Schemas["InjectDeclineResponse"];
