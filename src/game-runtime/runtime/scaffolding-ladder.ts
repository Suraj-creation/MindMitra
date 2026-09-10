import { ScaffoldingLevel, SCAFFOLDING_LADDER_ORDER } from "../types";

export interface ScaffoldingContext {
  step_name: string;
  primary_stimulus: string;
  contextual_text?: string;
  family_voice_url?: string;
  family_voice_speaker?: string;
  family_voice_transcript?: string;
  candidate_choices?: string[];
  target_id?: string;
}

export interface ScaffoldingCueResult {
  level: ScaffoldingLevel;
  display_text_cue?: string;
  audio_cue_url?: string;
  speaker_name?: string;
  active_choices?: string[];
  revealed_anchor_id?: string;
  full_support_active: boolean;
  assistance_weight: number; // 0.0 (independent) to 1.0 (full_support)
}

export function getNextScaffoldingLevel(current: ScaffoldingLevel): ScaffoldingLevel {
  const currentIndex = SCAFFOLDING_LADDER_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= SCAFFOLDING_LADDER_ORDER.length - 1) {
    return "full_support";
  }
  return SCAFFOLDING_LADDER_ORDER[currentIndex + 1];
}

export function getScaffoldingWeight(level: ScaffoldingLevel): number {
  switch (level) {
    case "independent":
      return 0.0;
    case "contextual_cue":
      return 0.2;
    case "modality_shift":
      return 0.4;
    case "narrowed_choice":
      return 0.6;
    case "partial_reveal":
      return 0.8;
    case "full_support":
      return 1.0;
    default:
      return 0.0;
  }
}

export function resolveScaffoldingStep(
  level: ScaffoldingLevel,
  ctx: ScaffoldingContext
): ScaffoldingCueResult {
  const weight = getScaffoldingWeight(level);

  switch (level) {
    case "independent":
      return {
        level,
        active_choices: ctx.candidate_choices,
        full_support_active: false,
        assistance_weight: weight,
      };

    case "contextual_cue":
      return {
        level,
        display_text_cue:
          ctx.contextual_text || "Think about the special time when this took place.",
        active_choices: ctx.candidate_choices,
        full_support_active: false,
        assistance_weight: weight,
      };

    case "modality_shift":
      return {
        level,
        display_text_cue: ctx.contextual_text,
        audio_cue_url: ctx.family_voice_url,
        speaker_name: ctx.family_voice_speaker,
        active_choices: ctx.candidate_choices,
        full_support_active: false,
        assistance_weight: weight,
      };

    case "narrowed_choice": {
      // Narrow candidate choices down to target + 1 distractor if multiple choices exist
      let narrowed = ctx.candidate_choices;
      if (ctx.candidate_choices && ctx.candidate_choices.length > 2 && ctx.target_id) {
        const other = ctx.candidate_choices.find((c) => c !== ctx.target_id);
        narrowed = other ? [ctx.target_id, other] : ctx.candidate_choices.slice(0, 2);
      }
      return {
        level,
        display_text_cue: ctx.contextual_text || "Let's focus on these two familiar possibilities.",
        audio_cue_url: ctx.family_voice_url,
        speaker_name: ctx.family_voice_speaker,
        active_choices: narrowed,
        full_support_active: false,
        assistance_weight: weight,
      };
    }

    case "partial_reveal":
      return {
        level,
        display_text_cue: "Here is where our journey begins.",
        revealed_anchor_id: ctx.target_id,
        active_choices: ctx.candidate_choices,
        full_support_active: false,
        assistance_weight: weight,
      };

    case "full_support":
      return {
        level,
        display_text_cue: "We've placed this together. Tap to gently confirm.",
        revealed_anchor_id: ctx.target_id,
        full_support_active: true,
        assistance_weight: weight,
      };

    default:
      return {
        level: "independent",
        full_support_active: false,
        assistance_weight: 0.0,
      };
  }
}
