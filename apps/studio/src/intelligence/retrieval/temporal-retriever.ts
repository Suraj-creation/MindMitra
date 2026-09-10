/**
 * Temporal Retrieval Lane — Time Horizon & Chronological Event Traversal
 *
 * Resolves queries anchored in time:
 * - "today", "yesterday", "tomorrow", "upcoming", "morning", "afternoon"
 * - Recent activity episodes & historical life events
 */

import { EvidenceItem } from "../types";
import { substrateRepo } from "../../substrate/repository";

export class TemporalRetriever {
  public async retrieve(
    personId: string,
    query: string
  ): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = [];
    const lower = query.toLowerCase();

    const isAskingYesterday = lower.includes("yesterday") || lower.includes("past");
    const isAskingToday = lower.includes("today") || lower.includes("now") || lower.includes("this afternoon") || lower.includes("this morning");
    const isAskingTomorrow = lower.includes("tomorrow") || lower.includes("upcoming") || lower.includes("future");

    // 1. Retrieve Experience Episodes (what happened yesterday or earlier today)
    if (isAskingYesterday || lower.includes("what did i do") || lower.includes("activity")) {
      const episodes = await substrateRepo.getExperienceEpisodes(personId, 5);
      for (const ep of episodes) {
        evidence.push({
          evidence_id: `ev_temp_ep_${ep.episode_id}`,
          entity_id: ep.activity_id,
          source_type: "experience_episode",
          source_id: ep.episode_id,
          claim_or_statement: `Activity Episode: ${ep.activity_name} completed in the ${ep.context.environment}. Engagement was ${ep.engagement.affect_signal}; completed successfully with ${ep.assistance_used.scaffolding_level}.`,
          relevance: 0.9,
          verification: "observed",
          confidence: 0.96,
          validity: "valid",
          timestamp: ep.timestamp,
          retrieval_lane: "TEMPORAL",
          authorization_scope: "consent:activity_telemetry",
          provenance: {
            author: "sensor_telemetry",
            source_class: "behavioral observation",
            authority_class: "behavioral observation",
          },
        });
      }
    }

    // 2. Retrieve Scheduled Temporal Events
    const events = await substrateRepo.getTemporalEvents(personId);
    for (const ev of events) {
      let isRelevant = false;
      if (isAskingToday && (ev.temporal_frame === "present" || ev.scheduled_at.toLowerCase().includes("today") || ev.scheduled_at.toLowerCase().includes("pm") || ev.scheduled_at.toLowerCase().includes("am"))) {
        isRelevant = true;
      } else if (isAskingTomorrow && (ev.temporal_frame === "future" || ev.scheduled_at.toLowerCase().includes("tomorrow") || ev.scheduled_at.toLowerCase().includes("upcoming"))) {
        isRelevant = true;
      } else if (isAskingYesterday && ev.temporal_frame === "past") {
        isRelevant = true;
      } else if (!isAskingYesterday && !isAskingTomorrow && !isAskingToday) {
        // Fallback: match title or description
        isRelevant = lower.includes(ev.title.toLowerCase()) || lower.includes("event");
      }

      if (isRelevant) {
        evidence.push({
          evidence_id: `ev_temp_ev_${ev.temporal_event_id}`,
          entity_id: ev.temporal_event_id,
          source_type: "temporal_event",
          source_id: ev.temporal_event_id,
          claim_or_statement: `Temporal Event: ${ev.title} (${ev.scheduled_at}). Status: ${ev.event_status}. ${ev.description}`,
          relevance: 0.88,
          verification: "verified",
          confidence: 0.95,
          validity: "valid",
          timestamp: ev.valid_from,
          retrieval_lane: "TEMPORAL",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: ev.source || "family_caregiver",
            source_class: "family confirmed",
            authority_class: "family confirmed",
          },
        });
      }
    }

    // 3. Routines anchored to time of day
    const routines = await substrateRepo.getRoutines(personId);
    for (const r of routines) {
      if (isAskingToday || lower.includes("tea") || lower.includes("routine") || lower.includes("now") || lower.includes("what should i do")) {
        evidence.push({
          evidence_id: `ev_temp_routine_${r.routine_id}`,
          entity_id: r.routine_id,
          source_type: "daily_routine",
          source_id: r.routine_id,
          claim_or_statement: `Daily Routine: ${r.title} scheduled at ${r.scheduled_time} (${r.time_of_day}). Preferred assistance: ${r.preferred_assistance_strategy}.`,
          relevance: 0.85,
          verification: "verified",
          confidence: 0.95,
          validity: "valid",
          timestamp: new Date().toISOString(),
          retrieval_lane: "TEMPORAL",
          authorization_scope: "consent:personal_identity",
          provenance: {
            author: "caregiver:anu",
            source_class: "caregiver reported",
            authority_class: "caregiver reported",
          },
        });
      }
    }

    return evidence;
  }
}

export const temporalRetriever = new TemporalRetriever();
