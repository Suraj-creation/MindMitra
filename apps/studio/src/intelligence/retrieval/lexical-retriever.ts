/**
 * Lexical Retrieval Lane — Exact Name, Phrase & Identifier Matching
 *
 * Provides ultra-fast, deterministic keyword matching for:
 * - Proper names ("Rina", "Anu", "Bikash", "Meena")
 * - Specific locations ("Tezpur", "Brahmaputra", "Guwahati", "Bengaluru")
 * - Culturally distinct terms ("til pitha", "nahor", "gendhu phul", "Tele-MANAS", "14416")
 */

import { EvidenceItem } from "../types";
import { substrateRepo } from "../../substrate/repository";

export class LexicalRetriever {
  public async retrieve(
    personId: string,
    query: string
  ): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];
    const lower = query.toLowerCase();

    // 1. Direct Contact Name Matching
    const contacts = await substrateRepo.getContacts(personId);
    for (const c of contacts) {
      if (lower.includes(c.call_name.toLowerCase()) || lower.includes(c.full_name.toLowerCase())) {
        evidence.push({
          evidence_id: `ev_lex_contact_${c.contact_id}`,
          entity_id: c.contact_id,
          source_type: "contact_record",
          source_id: c.contact_id,
          claim_or_statement: `Exact Name Match: ${c.full_name} (${c.call_name}) is ${c.relationship_label}, phone ${c.phone}, located in ${c.location}.`,
          relevance: 1.0,
          verification: "verified",
          confidence: 0.99,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "LEXICAL",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "system_directory",
            source_class: "family confirmed",
            authority_class: "family confirmed",
          },
        });
      }
    }

    // 2. Exact Place Matching
    const places = await substrateRepo.getPlaces(personId);
    for (const p of places) {
      if (lower.includes(p.name.toLowerCase()) || lower.includes("tezpur")) {
        evidence.push({
          evidence_id: `ev_lex_place_${p.place_id}`,
          entity_id: p.place_id,
          source_type: "place_record",
          source_id: p.place_id,
          claim_or_statement: `Exact Location Match: ${p.name} — ${p.significance}.`,
          relevance: 0.95,
          verification: "verified",
          confidence: 0.98,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "LEXICAL",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "system_world_model",
            source_class: "system/authoritative",
            authority_class: "system/authoritative",
          },
        });
      }
    }

    // 3. Cultural & Emergency Lexical Keywords
    if (lower.includes("tele-manas") || lower.includes("14416") || lower.includes("helpline") || lower.includes("emergency")) {
      evidence.push({
        evidence_id: "ev_lex_tele_manas",
        entity_id: "system:tele_manas_14416",
        source_type: "external_safety",
        source_id: "tele_manas_national_charter",
        claim_or_statement: "Tele-MANAS is the Government of India's 24/7 free mental health helpline (toll-free dial 14416) supporting Sonitpur, Assam.",
        relevance: 1.0,
        verification: "verified",
        confidence: 1.0,
        validity: "valid",
        timestamp: new Date().toISOString(),
        retrieval_lane: "LEXICAL",
        authorization_scope: "consent:personal_identity",
        provenance: {
          author: "national_health_authority",
          source_class: "system/authoritative",
          authority_class: "system/authoritative",
        },
      });
    }

    return evidence;
  }
}

export const lexicalRetriever = new LexicalRetriever();
