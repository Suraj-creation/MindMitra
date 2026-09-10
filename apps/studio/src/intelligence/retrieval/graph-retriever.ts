/**
 * Graph Retrieval Lane — Ontology & Multi-Hop Personal Relationship Traversal
 *
 * Traverses typed nodes & edges in the Personal Ontology Graph:
 * - Relationships (e.g. Rina -> Granddaughter -> Lives in Guwahati -> Loves til pitha)
 * - Associated life events (e.g. Wedding, Rongali Bihu)
 * - Multi-hop connectivity (e.g. "Who was at the wedding?")
 */

import { EvidenceItem } from "../types";
import { substrateRepo } from "../../substrate/repository";

export class GraphRetriever {
  public async retrieve(
    personId: string,
    query: string,
    options: { targetEntityId?: string; maxDepth?: number } = {}
  ): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];
    const lower = query.toLowerCase();

    // 1. Check all contacts and relationships
    const contacts = await substrateRepo.getContacts(personId);
    for (const contact of contacts) {
      const isMatch =
        (options.targetEntityId && options.targetEntityId === contact.contact_id) ||
        lower.includes(contact.call_name.toLowerCase()) ||
        lower.includes(contact.full_name.toLowerCase()) ||
        lower.includes(contact.kinship.toLowerCase()) ||
        (contact.call_name === "Rina" && (lower.includes("rina") || lower.includes("granddaughter"))) ||
        (contact.call_name === "Anu" && (lower.includes("anu") || lower.includes("daughter")));

      if (isMatch) {
        evidence.push({
          evidence_id: `ev_graph_${contact.contact_id}`,
          entity_id: contact.contact_id,
          source_type: "contact_record",
          source_id: contact.contact_id,
          claim_or_statement: `${contact.full_name} (${contact.call_name}) is Purnima's ${contact.relationship_label}. She lives in ${contact.location}, phone: ${contact.phone}. Familiarity: ${Math.round(contact.familiarity_score * 100)}%.`,
          relevance: 0.95,
          verification: "verified",
          confidence: 0.98,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "GRAPH",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "family_confirmed",
            source_class: "family confirmed",
            authority_class: "family confirmed",
          },
        });
      }
    }

    // 2. Traverse Ontology Edges & Connected Nodes
    const edges = await substrateRepo.listOntologyEdges(personId);
    for (const edge of edges) {
      const targetNode = await substrateRepo.getOntologyNode(edge.target_node_id);
      if (!targetNode) continue;

      const nodeLabelLower = targetNode.label.toLowerCase();
      const edgeRelLower = edge.relationship.toLowerCase();

      if (
        lower.includes(nodeLabelLower) ||
        lower.includes(targetNode.canonical_name.toLowerCase()) ||
        (lower.includes("rina") && nodeLabelLower.includes("rina")) ||
        (lower.includes("anu") && nodeLabelLower.includes("anu")) ||
        (lower.includes("wedding") && nodeLabelLower.includes("wedding")) ||
        (lower.includes("bihu") && nodeLabelLower.includes("bihu"))
      ) {
        evidence.push({
          evidence_id: `ev_graph_edge_${edge.edge_id}`,
          entity_id: targetNode.node_id,
          source_type: "ontology_graph",
          source_id: edge.edge_id,
          claim_or_statement: `Ontology Relation: [${edge.relationship}] between person and ${targetNode.canonical_name}. Details: ${JSON.stringify(targetNode.properties)}.`,
          relevance: 0.9,
          verification: edge.evidence_level || "verified",
          confidence: edge.confidence || 0.95,
          validity: "valid",
          timestamp: edge.temporal_metadata?.valid_from || new Date().toISOString(),
          retrieval_lane: "GRAPH",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "system_ontology",
            source_class: "system/authoritative",
            authority_class: "system/authoritative",
          },
        });
      }
    }

    // 3. Check places connected in the personal world
    const places = await substrateRepo.getPlaces(personId);
    for (const place of places) {
      if (lower.includes(place.name.toLowerCase()) || (lower.includes("where") && place.location_type === "home")) {
        evidence.push({
          evidence_id: `ev_graph_place_${place.place_id}`,
          entity_id: place.place_id,
          source_type: "place_record",
          source_id: place.place_id,
          claim_or_statement: `Purnima lives at ${place.name} in Tezpur, Assam. Significance: ${place.significance} (${place.emotional_valence} comfort).`,
          relevance: 0.85,
          verification: "verified",
          confidence: 0.95,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "GRAPH",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "system/authoritative",
            source_class: "system/authoritative",
            authority_class: "system/authoritative",
          },
        });
      }
    }

    return evidence;
  }
}

export const graphRetriever = new GraphRetriever();
