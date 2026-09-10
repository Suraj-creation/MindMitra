import {
  ScaffoldLevel,
  ScaffoldStep,
  TemporalEvent,
} from "../../domain/cognitive-experience";

export class TemporalScaffoldingLadder {
  /**
   * Constructs an adaptive scaffolding ladder (S0 -> S5) for a given temporal anchor.
   */
  public static buildScaffoldingLadderForEvent(
    event: TemporalEvent,
    targetFrame: "yesterday" | "today" | "tomorrow",
    honorific: string = "Aitâ"
  ): Record<ScaffoldLevel, ScaffoldStep> {
    const personName = event.people_refs?.[0]?.name || "a visitor";
    const personPhoto = event.people_refs?.[0]?.photo_url;
    const isYesterday = targetFrame === "yesterday";
    const isTomorrow = targetFrame === "tomorrow";

    const frameLabelEn = isYesterday ? "yesterday" : isTomorrow ? "tomorrow" : "today";
    const frameLabelAs = isYesterday ? "কালি" : isTomorrow ? "কাইলৈ" : "আজি";

    // Alternative distractor person for S3 choices
    const distractorPerson =
      personName.includes("Kamala")
        ? "Dr. Barua (Doctor)"
        : personName.includes("Rina")
        ? "Postman Biren"
        : "Neighbor Minoti";
    const distractorPersonAs =
      personName.includes("Kamala")
        ? "ডাঃ বৰুৱা"
        : personName.includes("Rina")
        ? "ডাকোৱাল বীৰেন"
        : "মিনতি বা";

    return {
      S0: {
        level: "S0",
        title: "Independent Anchor",
        instruction: isYesterday
          ? `Do you remember what special moment happened ${frameLabelEn}?`
          : isTomorrow
          ? `Do you remember who is expected to visit ${frameLabelEn}?`
          : `Do you remember what routine we share ${frameLabelEn}?`,
        cue_text: `${honorific}, take your time. There is no rush at all.`,
      },
      S1: {
        level: "S1",
        title: "Contextual Clue",
        instruction: isYesterday
          ? `Here is a gentle clue: Someone joined you for warm tea in your Tezpur courtyard ${frameLabelEn}.`
          : isTomorrow
          ? `Here is a gentle clue: A family member is traveling from Guwahati to have afternoon tea with you ${frameLabelEn}.`
          : `Here is a gentle clue: It is our familiar tea time on the front veranda.`,
        cue_text: `It happened on the cane chairs on the veranda in Tezpur.`,
      },
      S2: {
        level: "S2",
        title: "Visual & Voice Support",
        instruction: `Look at this photo together with us, ${honorific}:`,
        cue_text: `Here is a warm face you love very much.`,
        photo_url: personPhoto || "/assets/images/courtyard_friends_memory.jpg",
        voice_speaker: "Anu (Daughter)",
        voice_transcript: isYesterday
          ? `Ma, Kamala came over yesterday afternoon with freshly steamed sweet pithas. You both sat on the veranda.`
          : isTomorrow
          ? `Ma, remember Rina called from Guwahati? She is arriving tomorrow afternoon to sit with you for tea.`
          : `Ma, your warm Assam CTC tea with fresh Tulsi leaves is ready on the veranda.`,
      },
      S3: {
        level: "S3",
        title: "Focused Two-Choice Selection",
        instruction: isYesterday
          ? `Was it ${personName} or ${distractorPerson} who visited ${frameLabelEn}?`
          : isTomorrow
          ? `Is it ${personName} or ${distractorPerson} visiting ${frameLabelEn}?`
          : `Is it time for morning tea or evening prayer?`,
        options: [
          {
            id: "option_target",
            label: personName,
            assamese_label: event.people_refs?.[0]?.name ? event.people_refs[0].name : "পৰিচিত ব্যক্তি",
            is_target: true,
          },
          {
            id: "option_distractor",
            label: distractorPerson,
            assamese_label: distractorPersonAs,
            is_target: false,
          },
        ],
      },
      S4: {
        level: "S4",
        title: "Detailed Sensory Narrative",
        instruction: isYesterday
          ? `Yes, remember! In the afternoon sun, ${personName} brought warm sweet pithas and sat in the cane chairs.`
          : isTomorrow
          ? `Yes, remember! ${personName} is bringing fresh sandesh and sweet smiles from Guwahati tomorrow afternoon.`
          : `Yes, you enjoy the hot golden brew in the brass cup with sweet Tulsi leaves.`,
        cue_text: `The tea kettle was whistling and the breeze from the garden was calm.`,
      },
      S5: {
        level: "S5",
        title: "Full Affirmative Resolution",
        instruction: isYesterday
          ? `Yes, ${honorific}! ${event.title}. It was a lovely, comforting afternoon.`
          : isTomorrow
          ? `Yes, ${honorific}! ${event.title}. We are all looking forward to welcoming her tomorrow.`
          : `Yes, ${honorific}! ${event.title}. Let's savor this calm moment together.`,
        full_resolution: event.description,
      },
    };
  }

  /**
   * Advance to the next scaffolding step.
   */
  public static getNextLevel(current: ScaffoldLevel): ScaffoldLevel {
    switch (current) {
      case "S0":
        return "S1";
      case "S1":
        return "S2";
      case "S2":
        return "S3";
      case "S3":
        return "S4";
      case "S4":
        return "S5";
      case "S5":
        return "S5";
    }
  }
}
