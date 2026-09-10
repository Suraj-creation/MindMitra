/**
 * MindMitra Semantic Ontology Definition & Graph Schema Validation
 *
 * Implements typed semantic entities and explicit relationship rules.
 * Enforces strict typing rather than arbitrary strings.
 */

import {
  OntologyNodeType,
  OntologyRelationshipType,
  OntologyNode,
  OntologyEdge,
  EvidenceVerificationLevel,
} from "./types";

// Registered ontology entity types
export const REGISTERED_ONTOLOGY_TYPES: readonly OntologyNodeType[] = [
  "Person",
  "Relationship",
  "Kinship",
  "Place",
  "Object",
  "LifeEvent",
  "Story",
  "Photo",
  "Video",
  "Music",
  "Routine",
  "RoutineStep",
  "Reminder",
  "Task",
  "Activity",
  "ActivitySession",
  "ActivityStep",
  "Attempt",
  "Assistance",
  "Outcome",
  "Goal",
  "Intention",
  "Preference",
  "Observation",
  "Capability",
  "ExperienceEpisode",
  "Memory",
  "Conversation",
  "ConversationTurn",
  "Action",
  "Event",
  "Language",
  "CulturalConcept",
  "Appointment",
  "Visit",
  "Organization",
  "CareContext",
] as const;

// Rule mapping: Relationship -> Valid [SourceNodeType, TargetNodeType]
export const RELATIONSHIP_CONTRACTS: Record<
  OntologyRelationshipType,
  { source: OntologyNodeType[]; target: OntologyNodeType[]; description: string }
> = {
  PERSON_HAS_RELATIONSHIP_PERSON: {
    source: ["Person"],
    target: ["Person"],
    description: "Connects the person to a family member, caregiver, or contact.",
  },
  PERSON_LIVES_AT_PLACE: {
    source: ["Person"],
    target: ["Place"],
    description: "Specifies residential or ancestral place grounding.",
  },
  PERSON_KNOWS_PERSON: {
    source: ["Person"],
    target: ["Person"],
    description: "Social acquaintance or community familiarity.",
  },
  PERSON_REMEMBERS_EVENT: {
    source: ["Person"],
    target: ["LifeEvent", "Event"],
    description: "Episodic memory connection to an autobiographical life event.",
  },
  PHOTO_DEPICTS_PERSON: {
    source: ["Photo"],
    target: ["Person"],
    description: "Semantic link from a photo to individuals depicted inside it.",
  },
  PHOTO_ASSOCIATED_WITH_EVENT: {
    source: ["Photo"],
    target: ["LifeEvent", "Event"],
    description: "Connects media to the life event or festival it commemorates.",
  },
  EVENT_OCCURRED_AT_PLACE: {
    source: ["LifeEvent", "Event", "Visit", "Appointment"],
    target: ["Place"],
    description: "Spatial location grounding for a past or future event.",
  },
  EVENT_INVOLVES_PERSON: {
    source: ["LifeEvent", "Event", "ActivitySession", "Visit"],
    target: ["Person"],
    description: "Individuals participating in an event or visit.",
  },
  PERSON_ENJOYS_MUSIC: {
    source: ["Person"],
    target: ["Music"],
    description: "Musical reminiscence and soothing preference connection.",
  },
  PERSON_HAS_ROUTINE_ROUTINE: {
    source: ["Person"],
    target: ["Routine"],
    description: "Standing daily rhythm and familiar domestic routines.",
  },
  ACTIVITY_SESSION_INSTANCE_OF_ACTIVITY: {
    source: ["ActivitySession"],
    target: ["Activity"],
    description: "Links an individual gameplay or cognitive trial to its template.",
  },
  ACTIVITY_SESSION_USED_MEDIA_PHOTO: {
    source: ["ActivitySession"],
    target: ["Photo"],
    description: "Grounds a cognitive activity session in real personal media.",
  },
  ACTIVITY_SESSION_GENERATED_OBSERVATION: {
    source: ["ActivitySession", "ExperienceEpisode"],
    target: ["Observation"],
    description: "Links interaction telemetry to a certified cognitive observation.",
  },
  OBSERVATION_SUPPORTS_CAPABILITY: {
    source: ["Observation"],
    target: ["Capability"],
    description: "Feeds measurement-quality gated evidence into conditioned PCM state.",
  },
  EXPERIENCE_USED_STRATEGY_ASSISTANCE_POLICY: {
    source: ["ExperienceEpisode"],
    target: ["Preference", "Action"],
    description: "Associates an interaction outcome with the assistance strategy applied.",
  },
  CONVERSATION_REFERENCES_ENTITY: {
    source: ["ConversationTurn", "Conversation"],
    target: ["Person", "Place", "LifeEvent", "Object", "Music", "Routine"],
    description: "Extracts grounded entities mentioned during spoken or text dialogue.",
  },
  CONVERSATION_RESULTED_IN_ACTION: {
    source: ["ConversationTurn"],
    target: ["Action"],
    description: "Spoken intent triggering a safe, governed UI or calling action.",
  },
  ACTION_PRODUCED_OUTCOME: {
    source: ["Action"],
    target: ["Outcome"],
    description: "Resulting telemetry from an action execution.",
  },
  PERSON_HOLDS_GOAL: {
    source: ["Person"],
    target: ["Goal", "Intention"],
    description: "Stated or caregiver-supported functional goal.",
  },
  GOAL_DRAWS_ON_CAPABILITY: {
    source: ["Goal"],
    target: ["Capability"],
    description: "Identifies required cognitive/functional capabilities for goal attainment.",
  },
  MEMORY_GROUNDED_IN_EVIDENCE: {
    source: ["Memory"],
    target: ["ExperienceEpisode", "Observation", "Photo", "ConversationTurn"],
    description: "Links a longitudinal personal memory to originating evidence.",
  },
};

/**
 * Validate that an edge strictly respects the ontology contracts.
 */
export function validateOntologyEdge(
  relationship: OntologyRelationshipType,
  sourceNode: OntologyNode,
  targetNode: OntologyNode
): { valid: boolean; error?: string } {
  const contract = RELATIONSHIP_CONTRACTS[relationship];
  if (!contract) {
    return { valid: false, error: `Unregistered relationship type: ${relationship}` };
  }

  if (!contract.source.includes(sourceNode.node_type)) {
    return {
      valid: false,
      error: `Invalid source node type for ${relationship}: got ${sourceNode.node_type}, expected one of [${contract.source.join(", ")}]`,
    };
  }

  if (!contract.target.includes(targetNode.node_type)) {
    return {
      valid: false,
      error: `Invalid target node type for ${relationship}: got ${targetNode.node_type}, expected one of [${contract.target.join(", ")}]`,
    };
  }

  return { valid: true };
}

/**
 * Creates a validated ontology node.
 */
export function createOntologyNode(
  node_id: string,
  person_id: string,
  node_type: OntologyNodeType,
  label: string,
  canonical_name: string,
  properties: Record<string, any> = {}
): OntologyNode {
  return {
    node_id,
    person_id,
    node_type,
    label,
    canonical_name,
    properties,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Creates a validated ontology edge with temporal validity and evidence level.
 */
export function createOntologyEdge(
  edge_id: string,
  person_id: string,
  relationship: OntologyRelationshipType,
  source_node_id: string,
  target_node_id: string,
  provenance_id: string,
  options: {
    evidence_level?: EvidenceVerificationLevel;
    confidence?: number;
    valid_from?: string;
    valid_to?: string | null;
    observed_at?: string;
    occurred_at?: string;
  } = {}
): OntologyEdge {
  const now = new Date().toISOString();
  return {
    edge_id,
    person_id,
    relationship,
    source_node_id,
    target_node_id,
    temporal_metadata: {
      valid_from: options.valid_from || now,
      valid_to: options.valid_to ?? null,
      observed_at: options.observed_at || now,
      occurred_at: options.occurred_at,
      superseded_at: null,
    },
    evidence_level: options.evidence_level || "verified",
    confidence: options.confidence ?? 1.0,
    provenance_id,
  };
}
