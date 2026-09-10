import { GameExperienceSpecification, ValidationDetail } from "../types";

export class DignityValidator {
  public static readonly NAME = "DignityValidator";

  private static readonly INFANTILIZING_TERMS = [
    "good boy",
    "good girl",
    "kiddo",
    "baby steps",
    "little one",
    "smart cookie",
    "pat on the back",
    "who's a smart",
    "playtime",
    "doggie",
    "toddler",
  ];

  private static readonly HARSH_DEFICIT_TERMS = [
    "wrong",
    "failed",
    "incorrect",
    "you lost",
    "game over",
    "bad job",
    "try harder",
    "mistake",
    "loser",
    "dementia test",
    "cognitive decline",
    "memory failure",
    "defect",
    "invalid choice",
  ];

  private static readonly TIME_STRESS_TERMS = [
    "hurry up",
    "time is running out",
    "seconds left",
    "tick tock",
    "time's up",
    "deadline",
    "clock is ticking",
    "rush",
  ];

  private static readonly COMPETITIVE_TERMS = [
    "leaderboard",
    "high score",
    "ranked #",
    "points deducted",
    "penalty points",
    "you beat",
    "champion rank",
  ];

  public static validate(spec: GameExperienceSpecification): ValidationDetail {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract all conversational text
    const textCorpus: string[] = [
      spec.objective,
      spec.prompt.session_title,
      spec.prompt.session_subtitle,
      spec.prompt.welcome_prompt,
      spec.completion.celebration_title,
      spec.completion.celebration_message,
      spec.completion.summary_reminiscence_prompt,
      spec.completion.graceful_exit_text,
    ];

    for (const step of spec.sequence) {
      textCorpus.push(step.title);
      textCorpus.push(step.prompt.primary_prompt);
      if (step.prompt.guidance_cue) textCorpus.push(step.prompt.guidance_cue);
      if (step.prompt.spoken_prompt) textCorpus.push(step.prompt.spoken_prompt);

      // Options
      if (step.allowed_responses.options) {
        for (const opt of step.allowed_responses.options) {
          textCorpus.push(opt.text);
          textCorpus.push(opt.gentle_affirmation);
        }
      }

      // Hints
      textCorpus.push(step.hints.level_1_gentle_reminder);
      if (step.hints.level_2_visual_cue) textCorpus.push(step.hints.level_2_visual_cue);
      if (step.hints.level_3_family_voice) textCorpus.push(step.hints.level_3_family_voice.text);

      // Feedback
      textCorpus.push(step.feedback.affirmation);
      textCorpus.push(step.feedback.gentle_retry_prompt);
      if (step.feedback.no_wrong_answers_note) textCorpus.push(step.feedback.no_wrong_answers_note);
    }

    const fullText = textCorpus.join(" ").toLowerCase();

    // 1. Check Infantilizing terms
    for (const term of this.INFANTILIZING_TERMS) {
      if (fullText.includes(term)) {
        errors.push(
          `Dignity failed: Found infantilizing phrase '${term}'. Language must uphold adult elder respect and dignity.`
        );
      }
    }

    // 2. Check Harsh deficit terms
    for (const term of this.HARSH_DEFICIT_TERMS) {
      // Allow words like "wrong" ONLY if preceded by "no wrong" (e.g. "no wrong answers")
      const regex = new RegExp(`(?<!no\\s)${term}`, "i");
      if (regex.test(fullText)) {
        errors.push(
          `Dignity failed: Found harsh deficit / failure language '${term}'. Positive, validating wording is required.`
        );
      }
    }

    // 3. Check Time stress terms
    for (const term of this.TIME_STRESS_TERMS) {
      if (fullText.includes(term)) {
        errors.push(
          `Dignity failed: Found time-pressure phrase '${term}'. Countdown timers and rush phrasing are strictly banned.`
        );
      }
    }

    // 4. Check Competitive terms
    for (const term of this.COMPETITIVE_TERMS) {
      if (fullText.includes(term)) {
        errors.push(
          `Dignity failed: Found competitive gamification phrase '${term}'. Cognitive activities must be non-evaluative.`
        );
      }
    }

    return {
      validator_name: this.NAME,
      passed: errors.length === 0,
      errors,
      warnings,
      details: {
        analyzed_text_nodes_count: textCorpus.length,
      },
    };
  }
}
