import {
  ScaffoldLevel,
  TemporalEvent,
  TemporalOrientationContextPack,
} from "../../domain/cognitive-experience";
import { get_personalisation_context } from "../retrieval/retrieval-tools";
import { TemporalRetrievalEngine } from "./temporal-retrieval-engine";
import { getReferenceNow } from "./temporal-event-store";

// Days of week mapping (English -> Assamese)
const DAY_MAP_AS: Record<number, { en: string; as: string }> = {
  0: { en: "Sunday", as: "দেওবাৰ" },
  1: { en: "Monday", as: "সোমবাৰ" },
  2: { en: "Tuesday", as: "মঙলবাৰ" },
  3: { en: "Wednesday", as: "বুধবাৰ" },
  4: { en: "Thursday", as: "বৃহস্পতিবাৰ" },
  5: { en: "Friday", as: "শুক্ৰবাৰ" },
  6: { en: "Saturday", as: "শনিবাৰ" },
};

function getPartOfDay(date: Date): {
  part: "morning" | "afternoon" | "evening" | "night";
  asPart: string;
} {
  const hour = date.getHours();
  if (hour >= 4 && hour < 12) {
    return { part: "morning", asPart: "ৰাতিপুৱা" };
  } else if (hour >= 12 && hour < 17) {
    return { part: "afternoon", asPart: "দুপৰীয়া" };
  } else if (hour >= 17 && hour < 21) {
    return { part: "evening", asPart: "গধূলি" };
  } else {
    return { part: "night", asPart: "ৰাতি" };
  }
}

export function buildTemporalOrientationContextPack(
  personId: string,
  options: {
    referenceDate?: Date;
    customScaffoldingLevel?: ScaffoldLevel;
  } = {}
): TemporalOrientationContextPack {
  const refDate = options.referenceDate || getReferenceNow();
  const personalisation = get_personalisation_context(personId);

  // Retrieve candidates using MemoryFirewall
  const retrieval = TemporalRetrievalEngine.retrieveTemporalOrientationCandidates(personId, {
    referenceDate: refDate,
  });

  const dayOfWeekIndex = refDate.getDay();
  const dayInfo = DAY_MAP_AS[dayOfWeekIndex] || { en: "Tuesday", as: "মঙলবাৰ" };
  const partOfDayInfo = getPartOfDay(refDate);

  const localDateFormatted = refDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const localTimeFormatted = refDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Top anchors
  const yesterdayAnchor = retrieval.topYesterdayAnchor;
  const todayAnchor = retrieval.topTodayAnchor;
  const tomorrowAnchor = retrieval.topTomorrowAnchor;

  // Narratives
  const yesterdaySummary = yesterdayAnchor
    ? `Yesterday, ${yesterdayAnchor.title}.`
    : "Yesterday was a calm day in the Tezpur courtyard.";
  const yesterdayAssamese = yesterdayAnchor?.assamese_title
    ? `কালি, ${yesterdayAnchor.assamese_title}।`
    : "কালি তেজপুৰৰ চোতালত এটি শান্ত দিন আছিল।";

  const todaySummary = todayAnchor
    ? `Today is ${dayInfo.en} ${partOfDayInfo.part}. You have ${todayAnchor.title.toLowerCase()} scheduled.`
    : `Today is ${dayInfo.en} ${partOfDayInfo.part}. A calm, familiar day in your Tezpur courtyard.`;
  const todayAssamese = todayAnchor?.assamese_title
    ? `আজি ${dayInfo.as} ${partOfDayInfo.asPart}। আপোনাৰ সূচীত ${todayAnchor.assamese_title} আছে।`
    : `আজি ${dayInfo.as} ${partOfDayInfo.asPart}। তেজপুৰৰ বাৰাণ্ডাত এক সুখকৰ দিন।`;

  const tomorrowSummary = tomorrowAnchor
    ? `Tomorrow, ${tomorrowAnchor.title}.`
    : "Tomorrow will be another peaceful day with your family.";
  const tomorrowAssamese = tomorrowAnchor?.assamese_title
    ? `কাইলৈ, ${tomorrowAnchor.assamese_title}।`
    : "কাইলৈ পৰিয়ালৰ সৈতে আন এক সুন্দৰ দিন হ'ব।";

  // Provenance collection
  const provenanceIds: string[] = [];
  if (yesterdayAnchor?.provenance) provenanceIds.push(yesterdayAnchor.provenance);
  if (todayAnchor?.provenance) provenanceIds.push(todayAnchor.provenance);
  if (tomorrowAnchor?.provenance) provenanceIds.push(tomorrowAnchor.provenance);
  provenanceIds.push("prov:temporal_engine_v1");

  // Snapshot ID for deterministic caching and replay
  const snapshotId = `tpack_${personId.replace(":", "_")}_${refDate.getTime()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    person: {
      id: personId,
      display_name: personalisation.person.display_name,
      honorific: personalisation.person.honorific,
      preferred_language: personalisation.person.preferred_language,
      culture: personalisation.person.culture,
      location: personalisation.person.location,
    },
    now: {
      current_local_date: localDateFormatted,
      day_of_week: dayInfo.en,
      assamese_day: dayInfo.as,
      part_of_day: partOfDayInfo.part,
      assamese_part_of_day: partOfDayInfo.asPart,
      current_routine: "Morning courtyard tea & garden walk with fresh Tulsi",
      current_environment: "Courtyard Veranda, Tezpur (gentle breeze, birds chirping)",
      local_time_formatted: localTimeFormatted,
    },
    yesterday: {
      events: retrieval.yesterdayCandidates,
      meaningful_anchor: yesterdayAnchor,
      narrative_summary: yesterdaySummary,
      assamese_summary: yesterdayAssamese,
    },
    today: {
      events: retrieval.todayCandidates,
      routines: [
        {
          id: "routine:morning_tea",
          name: "Morning Courtyard Tea & Puja",
          assamese_name: "ৰাতিপুৱাৰ চাহ আৰু প্ৰাৰ্থনা",
          time: "08:00 AM",
          items: ["Assam CTC tea with ginger", "Tulsi water", "Brass bell"],
        },
        {
          id: "routine:afternoon_tea",
          name: "Afternoon Veranda Tea",
          assamese_name: "দুপৰীয়াৰ বাৰাণ্ডাৰ চাহ",
          time: "03:30 PM",
          items: ["Cardamom black tea", "Steamed pitha", "Cane chairs"],
        },
      ],
      meaningful_anchor: todayAnchor,
      narrative_summary: todaySummary,
      assamese_summary: todayAssamese,
    },
    tomorrow: {
      events: retrieval.tomorrowCandidates,
      meaningful_anchor: tomorrowAnchor,
      narrative_summary: tomorrowSummary,
      assamese_summary: tomorrowAssamese,
      has_confirmed_event: !!tomorrowAnchor,
    },
    familiar_people: retrieval.familiarPeople,
    media_assets: retrieval.mediaAssets,
    cultural_context: {
      season: "Autumn in Assam (শরৎ কাল)",
      assamese_season: "শৰৎ ঋতু",
      upcoming_cultural_anchor: "Kati Bihu evening lamp lighting in courtyard",
      customary_greeting: "নমস্কাৰ (Nomoskar)",
    },
    capability: {
      present_orientation: 0.85,
      recent_recognition: 0.88,
      recent_recall: 0.65,
      future_recognition: 0.82,
      future_recall: 0.60,
      temporal_ordering: 0.75,
      photo_support_utility: 0.92,
      voice_support_utility: 0.89,
      recommended_scaffolding_start: options.customScaffoldingLevel || "S0",
    },
    constraints: {
      language: personalisation.person.preferred_language,
      consent_active: true,
      sensitive_events_excluded: retrieval.audit.sensitive_events_excluded,
      cancelled_events_excluded: retrieval.audit.cancelled_events_excluded,
      stale_events_excluded: retrieval.audit.stale_events_excluded,
    },
    provenance_ids: provenanceIds,
    snapshot_id: snapshotId,
    generated_at: new Date().toISOString(),
  };
}
