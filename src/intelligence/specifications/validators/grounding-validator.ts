import { GameExperienceSpecification, ValidationDetail } from "../types";
import { cognitiveStore } from "../../cognitive-engine";

export class GroundingValidator {
  public static readonly NAME = "GroundingValidator";

  public static validate(
    spec: GameExperienceSpecification,
    groundingContext?: {
      memories?: Array<{ id: string; person_id: string }>;
      places?: Array<{ id: string; person_id: string }>;
      routes?: Array<{ id: string; person_id: string }>;
      people?: Array<{ id: string }>;
    }
  ): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    const personId = spec.person_id;
    if (!personId) {
      errors.push("Grounding failed: person_id is missing from specification.");
      return { validator_name: this.NAME, passed: false, errors, warnings };
    }

    // Use provided context or fall back to cognitiveStore
    const availableMemories =
      groundingContext?.memories ||
      cognitiveStore.memories.filter((m) => m.person_id === personId);
    const availablePlaces =
      groundingContext?.places ||
      cognitiveStore.familiarPlaces.filter((p) => p.person_id === personId);
    const availableRoutes =
      groundingContext?.routes ||
      cognitiveStore.familiarRoutes.filter((r) => r.person_id === personId);

    const memIds = new Set(availableMemories.map((m) => m.id));
    const placeIds = new Set(availablePlaces.map((p) => p.id));
    const routeIds = new Set(availableRoutes.map((r) => r.id));

    // 1. Verify Memory Bindings
    if (spec.memory_place_bindings.memory_ids) {
      for (const memId of spec.memory_place_bindings.memory_ids) {
        if (!memIds.has(memId)) {
          errors.push(
            `Grounding failed: Memory '${memId}' does not exist or does not belong to person '${personId}'.`
          );
        }
      }
    }

    // 2. Verify Place Bindings
    if (spec.memory_place_bindings.place_ids) {
      for (const pId of spec.memory_place_bindings.place_ids) {
        if (!placeIds.has(pId)) {
          errors.push(
            `Grounding failed: Place '${pId}' does not exist or does not belong to person '${personId}'.`
          );
        }
      }
    }

    // 3. Verify Destination Place
    if (spec.memory_place_bindings.destination_place_id) {
      if (!placeIds.has(spec.memory_place_bindings.destination_place_id)) {
        errors.push(
          `Grounding failed: Destination place '${spec.memory_place_bindings.destination_place_id}' is not in verified places.`
        );
      }
    }

    // 4. Verify Route Bindings
    if (spec.memory_place_bindings.route_id) {
      if (!routeIds.has(spec.memory_place_bindings.route_id)) {
        errors.push(
          `Grounding failed: Route '${spec.memory_place_bindings.route_id}' does not exist or does not belong to person '${personId}'.`
        );
      }
    }

    // 5. Verify Template-Specific Grounding Requirements
    if (spec.game_template === "reminiscence_journey_my_world") {
      if (
        !spec.memory_place_bindings.memory_ids ||
        spec.memory_place_bindings.memory_ids.length === 0
      ) {
        errors.push(
          "Grounding failed: Reminiscence Journey requires at least one grounded memory_id binding."
        );
      }
    } else if (spec.game_template === "route_builder_familiar_places") {
      if (!spec.memory_place_bindings.route_id) {
        errors.push(
          "Grounding failed: Route Builder requires a grounded route_id binding."
        );
      }
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        checked_memories: spec.memory_place_bindings.memory_ids?.length || 0,
        checked_places: spec.memory_place_bindings.place_ids?.length || 0,
        checked_routes: spec.memory_place_bindings.route_id ? 1 : 0,
      },
    };
  }
}
