import { ExperienceEpisode } from "../../domain/cognitive-experience";

export interface CapabilityDomains {
  photo_recognition: number;
  cued_recognition: number;
  free_recall: number;
  spatial_landmark_recognition: number;
  waypoint_sequencing: number;
  sensory_orientation: number;
  attention_span_minutes: number;
  guidance_tolerance: "high" | "moderate" | "minimal";
}

export interface CapabilityUpdateResult {
  updated: boolean;
  domain?: string;
  previous_estimate?: number;
  new_estimate?: number;
  delta?: number;
  measurement_quality: number;
  reason?: string;
}

export class PersonalCapabilityModel {
  private personCapabilities: Map<string, CapabilityDomains> = new Map();
  private updateHistory: Array<{
    person_id: string;
    domain: string;
    previous: number;
    updated: number;
    q: number;
    timestamp: string;
    episode_id: string;
  }> = [];

  constructor() {
    // Seed Purnima's baseline capabilities
    this.personCapabilities.set("person:purnima", {
      photo_recognition: 0.91,
      cued_recognition: 0.88,
      free_recall: 0.61,
      spatial_landmark_recognition: 0.85,
      waypoint_sequencing: 0.78,
      sensory_orientation: 0.82,
      attention_span_minutes: 15,
      guidance_tolerance: "high",
    });
  }

  public getCapabilities(personId: string): CapabilityDomains {
    if (!this.personCapabilities.has(personId)) {
      this.personCapabilities.set(personId, {
        photo_recognition: 0.85,
        cued_recognition: 0.80,
        free_recall: 0.55,
        spatial_landmark_recognition: 0.80,
        waypoint_sequencing: 0.75,
        sensory_orientation: 0.80,
        attention_span_minutes: 12,
        guidance_tolerance: "high",
      });
    }
    return { ...this.personCapabilities.get(personId)! };
  }

  /**
   * Evidence Gating: Measurement Quality (Q >= 0.65) MUST be validated before
   * allowing any game interaction to influence capability evidence.
   */
  public applyObservation(episode: ExperienceEpisode): CapabilityUpdateResult {
    const personId = episode.person_id;
    const currentCaps = this.getCapabilities(personId);
    const q = episode.measurement_quality;

    // Strict Gate: If Measurement Quality is degraded (caregiver prompt, disorientation, multiple skips), reject update
    if (q < 0.65 || (episode.measurement_quality_details && !episode.measurement_quality_details.valid_for_capability_update)) {
      return {
        updated: false,
        measurement_quality: q,
        reason: `Evidence rejected: Measurement Quality Q=${q.toFixed(2)} is below the non-negotiable 0.65 clinical threshold. Experience recorded in XM but excluded from capability baseline.`,
      };
    }

    // Determine target capability domain
    let domainKey: keyof CapabilityDomains = "photo_recognition";
    if (episode.template_key === "route_builder_familiar_places") {
      if (episode.scaffolding_level === "independent_route_recall") {
        domainKey = "spatial_landmark_recognition";
      } else {
        domainKey = "waypoint_sequencing";
      }
    } else if (episode.template_key === "reminiscence_journey_my_world") {
      if (episode.scaffolding_level === "recall_reminiscence") {
        domainKey = "free_recall";
      } else if (episode.scaffolding_level === "cued_recognition") {
        domainKey = "cued_recognition";
      } else {
        domainKey = "photo_recognition";
      }
    }

    const previousEstimate = currentCaps[domainKey] as number;

    // Target performance derived from engagement, assistance rate, and latency
    const assistanceFactor = 1 - (episode.assistance_rate || 0);
    const latencyBonus = (episode.interaction_quality?.mean_latency_ms || 3000) < 4000 ? 0.02 : 0.0;
    const targetPerformance = Math.min(0.98, Math.max(0.50, (episode.engagement_score * 0.7) + (assistanceFactor * 0.3) + latencyBonus));

    // EWMA update weighted by measurement quality Q
    const alpha = 0.12 * q; // small, safe learning rate proportional to observational confidence
    const rawNewEstimate = (alpha * targetPerformance) + ((1 - alpha) * previousEstimate);
    const newEstimate = Math.round(Math.min(0.98, Math.max(0.40, rawNewEstimate)) * 100) / 100;
    const delta = Math.round((newEstimate - previousEstimate) * 100) / 100;

    // Apply update to store
    const updatedCaps: CapabilityDomains = {
      ...currentCaps,
      [domainKey]: newEstimate,
    };
    this.personCapabilities.set(personId, updatedCaps);

    // Audit log update
    this.updateHistory.unshift({
      person_id: personId,
      domain: domainKey,
      previous: previousEstimate,
      updated: newEstimate,
      q,
      timestamp: new Date().toISOString(),
      episode_id: episode.id,
    });

    return {
      updated: true,
      domain: domainKey,
      previous_estimate: previousEstimate,
      new_estimate: newEstimate,
      delta,
      measurement_quality: q,
      reason: `Capability '${domainKey}' successfully updated via validated observation (Q=${q.toFixed(2)}).`,
    };
  }

  public getHistory(personId: string) {
    return this.updateHistory.filter((h) => h.person_id === personId);
  }
}

export const capabilityModel = new PersonalCapabilityModel();
