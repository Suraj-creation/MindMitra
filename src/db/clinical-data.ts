// Clinical Bridge Cohort Data & Clinical Telemetry

const LADDER = ["Independent", "Prompted", "Cued", "Guided", "Together", "Full assistance"];

const NIRMALI = {
  key: "nirmali",
  name: "Nirmali Bora", first: "Nirmali",
  line: "78 \u00b7 Assamese, some English \u00b7 own house in Gar-Ali, Jorhat \u00b7 son Anu nearby \u00b7 retired schoolteacher",
  lastReview: "12 Aug", freshShort: "today",
  period: "12 Aug \u2192 07 Sep 2026",
  confidence: "Moderate", changes: 3, questions: 4,
  tag: "3 changes", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12",
  why: "Two persistent changes, one measurement problem, one unresolved medication conflict.",
  consent: "Sharing agreed 12 Aug 2026: this clinic, her CHW, and her son. She can withdraw it in her own app.",
  fresh: [
    { k: "Last person interaction", v: "07 Sep, 09:12" },
    { k: "Last caregiver update", v: "06 Sep" },
    { k: "Last CHW visit", v: "02 Sep" },
    { k: "Last clinician review", v: "12 Aug" }
  ],
  network: [
    { k: "Son, primary informant", v: "Anu Bora" },
    { k: "Community health worker", v: "Bhaskar Das" },
    { k: "Granddaughter, occasional", v: "Rina" },
    { k: "Household", v: "Lives alone, son daily" }
  ],
  snapshot: [
    { k: "Function", v: "Meal preparation now requires guided assistance in 4 of 6 observations. It was independent at the last review.", src: "CHW \u00d7 3, caregiver \u00d7 2 \u00b7 first observed 22 Aug \u00b7 measurement good", bar: "#8C5715" },
    { k: "Cognitive / interaction", v: "Repeated orientation questions rose from about 1.7 to about 4.3 a day and have held for six days.", src: "Person-app sessions \u00d7 14, caregiver log \u00b7 measurement moderate", bar: "#8C5715" },
    { k: "Behaviour / context", v: "Evening restlessness on 6 evenings out of 8, mostly 18:30\u201320:00, alongside shorter sleep.", src: "Caregiver observation \u00d7 4, CHW \u00d7 1 \u00b7 contributors not established", bar: "#8C5715" },
    { k: "Measurement quality", v: "4 of 16 interaction sessions had poor audio and her hearing aid was unavailable in 3. Word-finding results from those sessions are excluded.", src: "Device metadata, CHW note 02 Sep", bar: "#C9BCA6" },
    { k: "Important unknown", v: "No recent structured observation of pain, hydration or urinary symptoms.", src: "Last asked 12 Aug, at your review", bar: "#C9BCA6" },
    { k: "Unresolved", v: "Medication list differs between her son, her CHW and this clinic's record. Not merged.", src: "3 sources \u00b7 needs verification", bar: "#8C5715" }
  ],
  strip: [
    { k: "Function", v: "New change", sub: "Cooking: independent \u2192 guided", fg: "#7A4A12" },
    { k: "Orientation", v: "Above her baseline", sub: "+153%, held 6 days", fg: "#7A4A12" },
    { k: "Measurement", v: "Moderate", sub: "4 of 16 sessions poor audio", fg: "#7A4A12" },
    { k: "Context", v: "Sleep shortened", sub: "Same period as restlessness", fg: "#4A423A" },
    { k: "Open questions", v: "4", sub: "1 medication conflict", fg: "#241F1A" }
  ],
  cells: [
    { k: "Since review", v: "3 meaningful changes", fg: "#7A4A12" },
    { k: "Function", v: "New change", fg: "#7A4A12" },
    { k: "Behaviour", v: "Persistent deviation", fg: "#7A4A12" },
    { k: "Measurement", v: "Moderate confidence", fg: "#7A4A12" },
    { k: "Last data", v: "Today", fg: "#3D5236" }
  ],
  unknowns: [
    { k: "Pain", v: "No structured observation since 12 Aug" },
    { k: "Hydration", v: "Insufficient data" },
    { k: "Urinary symptoms", v: "Not assessed" },
    { k: "Sleep", v: "Partial \u2014 caregiver report only, no instrumented nights" },
    { k: "Medication taken as prescribed", v: "Conflicting sources" },
    { k: "Hearing, current", v: "Aid unavailable since 24 Aug; last audiometry 2019" }
  ]
};

const CHANGES = [
  {
    id: "c1", n: "1", domain: "Function \u00b7 meal preparation",
    observed: "Meal preparation now requires guided assistance in 4 of 6 observations. At the last review it was independent.",
    kind: "New", kindBg: "#F5E9D7", kindBd: "#E7D6BC", kindFg: "#7A4A12",
    first: "22 Aug", persistence: "held 16 days",
    grid: [
      { k: "Previous pattern", v: "Independent, cooked twice daily" },
      { k: "Current", v: "Guided \u2014 needs someone alongside for the sequence" },
      { k: "Evidence", v: "CHW \u00d7 3, caregiver \u00d7 2" },
      { k: "Confidence", v: "Moderate" },
      { k: "Possible coincident context", v: "Fatigue reported on 3 of the visits" },
      { k: "Measurement quality", v: "Good \u2014 direct observation in her kitchen" }
    ],
    hint: "Six observations, three sources, no instrumented data. Kitchen conditions differed on 29 Aug.",
    items: [
      { role: "CHW observation", src: "Bhaskar Das", date: "02 Sep", quality: "Direct observation, good conditions",
        text: "Started the dal, then stopped after the tempering and asked what came next. Completed it with me naming each step. She did not seem distressed by it.",
        prov: [{ k: "Verification", v: "Observed" }, { k: "Occurrences", v: "3" }, { k: "Valid from", v: "22 Aug" }, { k: "Confidence", v: "High" }],
        raw: "observation_id: chw_obs_8841\nperson_id: p_nirmali\nsource_role: CHW_OBSERVATION\nauthor: chw_bhaskar_das\ncaptured_at: 2026-09-02T11:24+05:30\ndomain: IADL.cooking\nassistance_level_observed: GUIDED\nassistance_level_baseline: INDEPENDENT\nobservation_mode: in_person_direct\nmeasurement_quality: GOOD\ncontext_flags: [fatigue_reported]\ndevice_offline_at_capture: true\nsynced_at: 2026-09-02T18:03+05:30\nfirewall_projection: clinical_review" },
      { role: "Caregiver observation", src: "Anu Bora, son", date: "28 Aug", quality: "Informant report, retrospective",
        text: "She had the rice on but had not put water in it. I stayed and we did it together.",
        interp: "\u201cShe cannot cook on her own any more.\u201d Recorded as his conclusion, not as an observation.",
        prov: [{ k: "Verification", v: "Reported" }, { k: "Occurrences", v: "2" }, { k: "Recall gap", v: "Same day" }, { k: "Confidence", v: "Moderate" }],
        raw: "observation_id: cg_obs_5127\nsource_role: CAREGIVER_OBSERVATION\nauthor: caregiver_anu_bora\ncaptured_at: 2026-08-28T20:41+05:30\ndomain: IADL.cooking\nobservation_text: \"rice on, no water added\"\ninformant_interpretation: \"cannot cook alone any more\"  # stored in separate field\ninterpretation_merged_into_signal: false\nmeasurement_quality: MODERATE\nrecall_window_hours: 4" },
      { role: "Person statement", src: "Nirmali Bora", date: "30 Aug", quality: "In her own words, her own app",
        text: "\u201cI can cook. It is the order of things that slips \u2014 I put in the salt twice or not at all. I would rather someone sat in the kitchen than took it over.\u201d",
        prov: [{ k: "Language", v: "Assamese, translated" }, { k: "Consent", v: "Shared with clinician" }, { k: "Overridden by others", v: "No" }],
        raw: "observation_id: person_stmt_2290\nsource_role: PERSON_STATEMENT\ncaptured_at: 2026-08-30T17:02+05:30\nmodality: voice\nlanguage: as-IN\ntranslation_reviewed: true\nasr_confidence: 0.91\nconsent_scope: [clinician, chw]\nstatement_precedence: preserved  # not overwritten by informant inference" }
    ]
  },
  {
    id: "c2", n: "2", domain: "Cognitive / interaction \u00b7 orientation and repetition",
    observed: "Repeated orientation questions rose from about 1.7 a day to about 4.3 a day, and have stayed there for six days.",
    kind: "Persistent deviation", kindBg: "#F5E9D7", kindBd: "#E7D6BC", kindFg: "#7A4A12",
    first: "01 Sep", persistence: "held 6 days",
    grid: [
      { k: "Her baseline", v: "1.7 events/day over the previous 8 weeks" },
      { k: "Recent period", v: "4.3 events/day" },
      { k: "Deviation", v: "+153% against her own baseline" },
      { k: "Observations", v: "28 events across 14 sessions and 5 caregiver entries" },
      { k: "Possible coincident context", v: "Sleep 5.2 h against her usual 6.8 h, same six days" },
      { k: "Measurement quality", v: "Moderate \u2014 4 sessions excluded for audio" }
    ],
    hint: "The percentage is distance from her own recent pattern. It is not a severity score and not a comparison with anyone else.",
    items: [
      { role: "System-derived signal", src: "Temporal aggregation", date: "01\u201307 Sep", quality: "10 of 14 sessions usable",
        text: "Question-repetition events counted per day from person-app dialogue and caregiver entries, compared against her own trailing eight-week window. Low-quality sessions were excluded before the comparison, not after.",
        prov: [{ k: "Baseline window", v: "8 weeks" }, { k: "Method", v: "Own-baseline deviation" }, { k: "Excluded", v: "4 sessions" }, { k: "Model version", v: "change-engine 2.4" }],
        raw: "signal_id: sig_repetition_p_nirmali\nsignal_type: INTERACTION.repetition_orientation\nobservation_window: 2026-09-01/2026-09-07\nbaseline: {value: 1.7, unit: events_per_day, window_weeks: 8, n_days: 56}\ncurrent: {value: 4.3, unit: events_per_day, n_days: 6}\ndirection: increase\nmagnitude: {relative: 1.53, absolute: 2.6}\npersistence_days: 6\nobservation_count: 28\nsources: [PERSON_APP_SESSION x10, CAREGIVER_OBSERVATION x5]\nexcluded_sources: [PERSON_APP_SESSION x4 (audio_quality_low)]\nconfidence: MODERATE\nmeasurement_quality: MODERATE\ncontext: [sleep_duration_below_baseline]\nunknowns: [pain, hydration, urinary_symptoms]\nclinical_relevance: L4\npopulation_comparison: none\ngenerated_at: 2026-09-07T14:20+05:30" },
      { role: "Caregiver observation", src: "Anu Bora, son", date: "05 Sep", quality: "Informant report",
        text: "Asked me four times before lunch which day Rina is coming. I answered each time.",
        interp: "\u201cHer memory is getting worse.\u201d Held separately from the count above.",
        prov: [{ k: "Verification", v: "Reported" }, { k: "Corroborated", v: "Yes, session log" }],
        raw: "observation_id: cg_obs_5188\nsource_role: CAREGIVER_OBSERVATION\ncaptured_at: 2026-09-05T13:10+05:30\nevent_type: repeated_question\ncount_reported: 4\ncorroborating_session: session_1442\ninformant_interpretation_stored_separately: true" }
    ]
  },
  {
    id: "c3", n: "3", domain: "Behaviour and context \u00b7 evening restlessness",
    observed: "Restlessness on 6 evenings out of 8, mostly between 18:30 and 20:00. Contributors have not been established.",
    kind: "Recurring", kindBg: "#F1EADF", kindBd: "#E0D5C3", kindFg: "#4A423A",
    first: "30 Aug", persistence: "6 of 8 evenings",
    grid: [
      { k: "Pattern", v: "18:30\u201320:00, settles by about 21:00" },
      { k: "Sleep, same period", v: "5.2 h against her usual 6.8 h" },
      { k: "Routine", v: "Son's shift changed 29 Aug; evening tea moved" },
      { k: "Pain", v: "Not assessed recently" },
      { k: "Medication change", v: "None reported" },
      { k: "Environment", v: "Unknown \u2014 noise and light not recorded" }
    ],
    hint: "Listed as an observed behaviour with candidate contributors. The system has not attributed a cause and has not labelled her.",
    items: [
      { role: "Caregiver observation", src: "Anu Bora, son", date: "04 Sep", quality: "Informant report",
        text: "Walks from the door to the window and back, wants to go out to look for her sister. Calms if I sit with her and talk about Nagaon.",
        prov: [{ k: "Occurrences", v: "4" }, { k: "What was tried", v: "Sitting with her, talking" }, { k: "Result", v: "Settled within 20 min" }],
        raw: "observation_id: cg_obs_5171\nsource_role: CAREGIVER_OBSERVATION\ncaptured_at: 2026-09-04T19:48+05:30\nbehaviour: evening_restlessness\ntime_window: 18:30-20:00\nintervention_tried: co_presence_reminiscence\nobserved_response: settled_20min\nbehaviour_label_applied: none  # no 'agitated patient' classification stored" },
      { role: "CHW observation", src: "Bhaskar Das", date: "02 Sep", quality: "Direct, one evening visit",
        text: "Visited at 19:00. She was up and unsettled. The room faces the road and it was loud. No fan working. She said she sleeps badly since the heat.",
        prov: [{ k: "Verification", v: "Observed" }, { k: "Environment noted", v: "Noise, heat" }],
        raw: "observation_id: chw_obs_8839\nsource_role: CHW_OBSERVATION\ncaptured_at: 2026-09-02T19:04+05:30\nenvironment: {noise: high, ventilation: poor}\nperson_statement_quoted: \"sleeps badly since the heat\"\nescalation_raised: false" }
    ]
  }
];

const SIGNALS = [
  { name: "Repetition / orientation", baseline: "1.7 /day", recent: "4.3 /day", deviation: "+153%", pct: "78%",
    scaleLeft: "Her own 8-week range", scaleRight: "Current 6-day mean", bar: "#8C5715", curFg: "#7A4A12",
    rows: [{ k: "Persistence", v: "6 days" }, { k: "Observations", v: "28 across 15 sources" }, { k: "Measurement quality", v: "Moderate, 4 sessions excluded" }, { k: "Sources", v: "Person app, caregiver" }, { k: "Coincident context", v: "Sleep below her baseline" }, { k: "Confidence", v: "Moderate" }],
    status: "Requires clinical review \u00b7 relevance L4", statusFg: "#7A4A12" },
  { name: "Task independence \u00b7 meal preparation", baseline: "Independent", recent: "Guided in 4 of 6", deviation: "State change", pct: "62%",
    scaleLeft: "Independent", scaleRight: "Full assistance", bar: "#8C5715", curFg: "#7A4A12",
    rows: [{ k: "First detected", v: "22 Aug" }, { k: "Persistence", v: "16 days" }, { k: "Observations", v: "6" }, { k: "Measurement quality", v: "Good" }, { k: "Sources", v: "CHW \u00d7 3, caregiver \u00d7 2, person \u00d7 1" }, { k: "Confidence", v: "Moderate" }],
    status: "Requires clinical review \u00b7 relevance L4", statusFg: "#7A4A12" },
  { name: "Sleep duration, reported", baseline: "6.8 h", recent: "5.2 h", deviation: "\u22121.6 h", pct: "58%",
    scaleLeft: "Her own 8-week mean", scaleRight: "Current week", bar: "#B0762A", curFg: "#7A4A12",
    rows: [{ k: "Persistence", v: "7 days" }, { k: "Observations", v: "7 caregiver entries" }, { k: "Measurement quality", v: "Partial \u2014 report only, no instrumented nights" }, { k: "Sources", v: "Caregiver" }, { k: "Coincident context", v: "Heat, no working fan (CHW, 02 Sep)" }, { k: "Confidence", v: "Low to moderate" }],
    status: "Worth observing \u00b7 relevance L3", statusFg: "#4A423A" },
  { name: "Activity engagement, person app", baseline: "4.2 sessions/week", recent: "4.0 sessions/week", deviation: "Within her range", pct: "34%",
    scaleLeft: "Her own range", scaleRight: "Higher", bar: "#4A6141", curFg: "#3D5236",
    rows: [{ k: "Voluntary vs prompted", v: "13 voluntary, 5 prompted" }, { k: "Preferred", v: "Music reminiscence" }, { k: "Hardest", v: "Sequencing tasks" }, { k: "Abandonment", v: "2 of 18 sessions" }, { k: "Measurement quality", v: "14 good, 4 moderate" }, { k: "Confidence", v: "Good" }],
    status: "No action \u00b7 exposure only, not an outcome measure", statusFg: "#3D5236" },
  { name: "Word-finding in dialogue", baseline: "Not comparable", recent: "Withheld", deviation: "Suppressed", pct: "0%",
    scaleLeft: "Insufficient measurement quality", scaleRight: "", bar: "#C9BCA6", curFg: "#736A5E",
    rows: [{ k: "Why suppressed", v: "Audio poor in 4 of 5 relevant sessions" }, { k: "Hearing aid", v: "Unavailable since 24 Aug" }, { k: "Language match", v: "2 sessions began in Hindi prompts" }, { k: "Fatigue", v: "3 sessions after 20:00" }, { k: "Sample after exclusions", v: "1 session" }],
    status: "Not interpretable \u00b7 repeat measurement before drawing any conclusion", statusFg: "#736A5E" }
];

const RESEARCH = [
  { name: "Speech timing and pause structure", what: "Derived from voice sessions. Pause length and turn latency, aggregated weekly. Currently trending within her own range.", status: "Research-stage, not clinically validated" },
  { name: "Passive routine phenotype", what: "Movement between rooms inferred from device interaction times. Sparse and unvalidated for this household.", status: "Research-stage, not clinically validated" }
];

const FUNC = [
  { domain: "Meal preparation", kind: "IADL", base: 0, cur: 3, tag: "Persistent change", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12",
    cells: [{ k: "First detected", v: "22 Aug" }, { k: "Persistence", v: "16 days" }, { k: "Observed", v: "4 of 6 recent observations" }, { k: "Sources", v: "CHW \u00d7 3, caregiver \u00d7 2" }, { k: "Measurement quality", v: "Good" }] },
  { domain: "Medication management", kind: "IADL", base: 1, cur: 1, tag: "Unable to assess", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A",
    cells: [{ k: "Last verified", v: "12 Aug, by you" }, { k: "Why unassessed", v: "Medication list itself is in conflict" }, { k: "Observed", v: "\u2014" }, { k: "Sources", v: "Conflicting: caregiver, CHW, clinic" }, { k: "Measurement quality", v: "Insufficient" }] },
  { domain: "Money and shopping", kind: "IADL", base: 1, cur: 1, tag: "Stable", tagBg: "#E6EDE2", tagBd: "#CFDCC8", tagFg: "#3D5236",
    cells: [{ k: "Last verified", v: "02 Sep" }, { k: "Persistence", v: "Unchanged 11 weeks" }, { k: "Observed", v: "3 observations" }, { k: "Sources", v: "CHW \u00d7 2, person \u00d7 1" }, { k: "Measurement quality", v: "Good" }] },
  { domain: "Bathing and dressing", kind: "ADL", base: 0, cur: 0, tag: "Stable", tagBg: "#E6EDE2", tagBd: "#CFDCC8", tagFg: "#3D5236",
    cells: [{ k: "Last verified", v: "02 Sep" }, { k: "Persistence", v: "Unchanged since first record" }, { k: "Observed", v: "2 observations" }, { k: "Sources", v: "CHW \u00d7 1, caregiver \u00d7 1" }, { k: "Measurement quality", v: "Good" }] },
  { domain: "Phone use and appointments", kind: "IADL", base: 0, cur: 1, tag: "Single observation \u00b7 not established", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A",
    cells: [{ k: "First detected", v: "31 Aug" }, { k: "Persistence", v: "Seen once" }, { k: "Observed", v: "1 of 4 observations" }, { k: "Sources", v: "Caregiver \u00d7 1" }, { k: "Measurement quality", v: "Moderate" }] }
];

const MQ = {
  count: "16",
  tally: [
    { n: "16", label: "Interaction sessions in the period", fg: "#241F1A" },
    { n: "10", label: "Good quality", fg: "#3D5236" },
    { n: "2", label: "Moderate", fg: "#7A4A12" },
    { n: "4", label: "Poor \u2014 excluded from ability interpretation", fg: "#7A4A12" }
  ],
  suppressed: {
    title: "Recent word-finding results are not reliable enough to interpret as a change in her ability.",
    body: "Her dialogue performance looked lower across five sessions. Four of those five had poor audio, her hearing aid has been unavailable since 24 August, two sessions opened with Hindi prompts rather than Assamese, and three ran after 20:00 when she is tired. One usable session remains, which is not a basis for a longitudinal statement. The finding here is about the conditions, not about her.",
    why: [
      { k: "Audio quality", v: "Poor in 4 of 5" },
      { k: "Hearing aid", v: "Unavailable since 24 Aug" },
      { k: "Language match", v: "2 sessions mismatched" },
      { k: "Session time", v: "3 after 20:00" },
      { k: "ASR confidence", v: "Median 0.58" },
      { k: "Usable sample", v: "1 session" }
    ]
  },
  next: [
    { t: "Repeat the dialogue sessions in a quiet room, before 17:00, with the hearing aid in place." },
    { t: "Confirm Assamese as the session language on her device; two sessions defaulted to Hindi after an update." },
    { t: "Reassess hearing before any interaction-based finding is interpreted. Last audiometry was 2019." },
    { t: "The CHW has been asked, through his own app, to check whether the aid is being worn. Requested by her son on 06 Sep." }
  ],
  factors: [
    { k: "Audio quality", v: "10 good / 2 moderate / 4 poor", fg: "#7A4A12", note: "Poor sessions clustered on 27 Aug\u201303 Sep, all in the afternoon with the road-facing window open." },
    { k: "Language match", v: "14 of 16 matched", fg: "#7A4A12", note: "Two sessions presented Hindi prompts. Both are excluded from language and word-finding signals." },
    { k: "Hearing support", v: "Aid unavailable, 3 sessions", fg: "#7A4A12", note: "Unavailable since 24 Aug. Hearing loss imitates memory loss more often than anything else on this list." },
    { k: "Fatigue window", v: "3 sessions after 20:00", fg: "#7A4A12", note: "Kept in engagement signals, excluded from ability comparisons." },
    { k: "Interruption", v: "2 sessions cut short", fg: "#4A423A", note: "Household interruption. Partial sessions counted for exposure only." },
    { k: "Observation completeness", v: "Function 6/6, pain 0/6", fg: "#4A423A", note: "Function was observed at every CHW visit. Pain was not asked at any of them." },
    { k: "Device and connectivity", v: "9 captures made offline", fg: "#4A423A", note: "All nine synced with their original capture timestamps intact; none arrived out of order." },
    { k: "Data freshness", v: "Person data today, CHW 5 days", fg: "#3D5236", note: "No source in this record is older than her last review." }
  ]
};

const EVID = [
  { label: "Person statements", dot: "#8C5715", count: "6 in period",
    rule: "Her own words, kept first-hand. Never overwritten by an informant report or a system inference.",
    items: [
      { who: "Nirmali Bora, in Assamese", date: "30 Aug", text: "\u201cI can cook. It is the order of things that slips. I would rather someone sat in the kitchen than took it over.\u201d", meta: "Voice, translated, translation reviewed \u00b7 shared with clinician by her consent" },
      { who: "Nirmali Bora", date: "06 Sep", text: "\u201cI do not sleep. The heat, and the fan is not working. Do not tell Anu, he will buy things.\u201d", meta: "Marked private to the clinician at her request \u00b7 not visible in her son's app" },
      { who: "Nirmali Bora", date: "07 Sep", text: "\u201cI am not confused. I ask because nobody tells me twice.\u201d", meta: "Recorded against the repetition signal as her perception of the change" }
    ] },
  { label: "Caregiver evidence \u00b7 informant", dot: "#4A6141", count: "5 in period",
    rule: "Observation and interpretation are stored in separate fields. Only the observation feeds a signal.",
    items: [
      { who: "Anu Bora, son", date: "05 Sep", text: "Asked four times before lunch which day Rina is coming.", interp: "\u201cHer memory is getting worse.\u201d", meta: "Corroborated by session log \u00b7 same-day entry" },
      { who: "Anu Bora, son", date: "04 Sep", text: "Walks door to window between 18:30 and 20:00. Settles if I sit with her.", interp: "\u201cShe is frightened in the evenings.\u201d", meta: "What was tried: sitting with her. Response: settled within 20 minutes." },
      { who: "Anu Bora, son", date: "28 Aug", text: "Rice on the stove with no water added. We finished it together.", interp: "\u201cShe cannot cook alone any more.\u201d", meta: "One of 2 caregiver observations behind the cooking change" }
    ] },
  { label: "CHW evidence \u00b7 field", dot: "#736A5E", count: "3 visits",
    rule: "Structured field observation, captured offline and synced with its original timestamp.",
    items: [
      { who: "Bhaskar Das \u00b7 home visit", date: "02 Sep", text: "Cooking guided. Room hot and loud at 19:00, fan not working. Hearing aid not in the house. Blood pressure 148/86. She was bright and talking.", meta: "Function 6/6 domains observed \u00b7 pain not asked \u00b7 escalation not raised" },
      { who: "Bhaskar Das \u00b7 home visit", date: "24 Aug", text: "Hearing aid missing since a visit to her daughter's. Asked the family to look for it. Repeated questions noted twice in the hour.", meta: "Origin of the hearing-aid gap in every interaction signal since" },
      { who: "Bhaskar Das \u00b7 screening", date: "12 Aug", text: "Ten-question screening. Memory changes worth a clinician's look, daily life largely intact, not isolated, hearing checked first and an aid needed.", meta: "The referral that brought her to your 12 Aug review" }
    ] }
];

const CONTRA = [
  { title: "Medication list differs across three sources", status: "Unresolved",
    rows: [
      { src: "This clinic, 12 Aug", val: "Amlodipine 5 mg, metformin 500 mg twice daily, calcium", date: "12 Aug" },
      { src: "Caregiver, 06 Sep", val: "Amlodipine 5 mg, metformin 500 mg twice daily, calcium, plus a sleep tablet from a local pharmacy", date: "06 Sep" },
      { src: "CHW, 02 Sep", val: "Amlodipine 5 mg, metformin 500 mg once daily, calcium. No sleep tablet seen.", date: "02 Sep" }
    ],
    action: "Verify the medication list at the review on 11 September, with the strips in hand. The unnamed sleep tablet is worth identifying before the evening restlessness is interpreted." },
  { title: "Hearing aid: in use, or missing", status: "Unresolved",
    rows: [
      { src: "Caregiver, 06 Sep", val: "\u201cShe wears it when she goes out.\u201d", date: "06 Sep" },
      { src: "CHW, 02 Sep", val: "Aid not present in the house. Family were asked to look for it on 24 Aug.", date: "02 Sep" },
      { src: "Device metadata", val: "No paired hearing device detected in any session since 24 Aug", date: "24 Aug \u2192" }
    ],
    action: "Confirm at the review. Every interaction-based signal in this record depends on the answer." }
];

const QUESTIONS = [
  { id: "q1", domain: "Function and context", text: "Could the new need for guided assistance with cooking relate to the shortened sleep and the evening restlessness in the same period, rather than to a step change in ability?",
    basis: "Cooking change from 22 Aug (CHW \u00d7 3, caregiver \u00d7 2); sleep 5.2 h against her own 6.8 h from 31 Aug; restlessness on 6 of 8 evenings.", tag: "Relevance L4", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12" },
  { id: "q2", domain: "Measurement before interpretation", text: "Would it be worth reassessing her hearing before any interaction-based finding is read as cognitive? Her aid has been unavailable since 24 August and the last audiometry was 2019.",
    basis: "4 of 5 word-finding sessions excluded for audio; no paired hearing device since 24 Aug; CHW note 24 Aug; screening on 12 Aug already flagged hearing first.", tag: "Blocks interpretation", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12" },
  { id: "q3", domain: "Reconciliation", text: "Which medication list should stand? A sleep tablet from a local pharmacy appears in the caregiver's list only, and it appeared in the same fortnight as the evening restlessness.",
    basis: "Three lists differing on metformin frequency and on one unnamed sleep tablet: clinic 12 Aug, CHW 02 Sep, caregiver 06 Sep.", tag: "Unresolved conflict", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12" },
  { id: "q4", domain: "Unassessed", text: "Pain, hydration and urinary symptoms have not been asked about since your last review. Would you like them assessed before the restlessness is attributed to anything?",
    basis: "Observation completeness: pain 0 of 6 CHW visits; no hydration entries; urinary symptoms never recorded.", tag: "Missing data", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A" }
];

const FOLLOWUPS = [
  { id: "f1", task: "Reassess hearing, then repeat two dialogue sessions in quiet conditions", why: "Interaction signals are uninterpretable until this is done", owner: "You + Bhaskar Das", due: "By 18 Sep" },
  { id: "f2", task: "Verify the medication list with the strips present", why: "Three conflicting lists, one unidentified sleep tablet", owner: "You, at the 11 Sep review", due: "11 Sep" },
  { id: "f3", task: "Ask about pain, hydration and urinary symptoms", why: "Not assessed since 12 Aug; candidate contributors to restlessness", owner: "Bhaskar Das, next visit", due: "By 14 Sep" },
  { id: "f4", task: "Check the fan and the evening room conditions", why: "CHW recorded heat and road noise at 19:00 on 02 Sep", owner: "Anu Bora, son", due: "This week" }
];

const OTHERS = [
  { key: "aita", name: "Aita Sangma", line: "74 \u00b7 Garo \u00b7 lives with her daughter's family \u00b7 Tura", lastReview: "12 Aug", freshShort: "yesterday",
    tag: "Acute change \u00b7 L5", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12",
    why: "Onset within 48 hours across three sources. Nothing else in her record has moved for five months.",
    strip: [
      { k: "Onset", v: "2 days", sub: "Stable for the 5 months before", fg: "#7A4A12" },
      { k: "Measurement", v: "Trustworthy", sub: "Good audio, aid in use", fg: "#3D5236" },
      { k: "Observed", v: "New confusion", sub: "Reduced activity, caregiver concern", fg: "#7A4A12" },
      { k: "Unknown", v: "Infection, hydration, pain", sub: "None assessed", fg: "#7A4A12" },
      { k: "Open questions", v: "2", sub: "Both routed to you", fg: "#241F1A" }
    ],
    cells: [{ k: "Since review", v: "Acute change", fg: "#7A4A12" }, { k: "Onset", v: "2 days", fg: "#7A4A12" }, { k: "Measurement", v: "Trustworthy", fg: "#3D5236" }, { k: "Context", v: "Not established", fg: "#4A423A" }, { k: "Last data", v: "Yesterday", fg: "#3D5236" }] },
  { key: "bhogeswar", name: "Bhogeswar Nath", line: "69 \u00b7 Kamalabari \u00b7 wife is primary carer \u00b7 referred 26 Aug", lastReview: "Never seen here", freshShort: "5 days",
    tag: "Referral not attended", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12",
    why: "Referred to this department on 26 August. Appointment 2 September, not attended. No assessment exists.",
    strip: [
      { k: "Referral", v: "Not attended", sub: "Appointment was 2 Sep", fg: "#7A4A12" },
      { k: "Evidence", v: "Screening only", sub: "CHW, 26 Aug", fg: "#4A423A" },
      { k: "Function", v: "Needs help with money", sub: "1 observation, not established", fg: "#4A423A" },
      { k: "Measurement", v: "Insufficient", sub: "No interaction sessions", fg: "#736A5E" },
      { k: "Open questions", v: "1", sub: "Transport, per the CHW", fg: "#241F1A" }
    ],
    cells: [{ k: "Since review", v: "No baseline yet", fg: "#736A5E" }, { k: "Function", v: "1 observation", fg: "#4A423A" }, { k: "Behaviour", v: "No data", fg: "#736A5E" }, { k: "Measurement", v: "Insufficient", fg: "#736A5E" }, { k: "Last data", v: "02 Sep", fg: "#4A423A" }] },
  { key: "hemanta", name: "Hemanta Gogoi", line: "81 \u00b7 Kamalabari \u00b7 lives alone \u00b7 declined referral", lastReview: "Never seen here", freshShort: "2 days",
    tag: "Watching", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A",
    why: "Mild memory change on screening. He declined a clinic referral and that decision stands in his record.",
    strip: [
      { k: "Memory", v: "Mild change", sub: "Screening, 5 Sep", fg: "#4A423A" },
      { k: "Function", v: "Independent", sub: "2 observations", fg: "#3D5236" },
      { k: "Context", v: "No visitor in 11 days", sub: "The CHW's main concern", fg: "#7A4A12" },
      { k: "Consent", v: "Ward group only", sub: "Nephew not to be told", fg: "#4A423A" },
      { k: "Open questions", v: "0", sub: "Nothing for you today", fg: "#241F1A" }
    ],
    cells: [{ k: "Since review", v: "No change", fg: "#3D5236" }, { k: "Function", v: "Stable", fg: "#3D5236" }, { k: "Behaviour", v: "No data", fg: "#736A5E" }, { k: "Measurement", v: "Screening only", fg: "#4A423A" }, { k: "Last data", v: "05 Sep", fg: "#4A423A" }] },
  { key: "jonaki", name: "Jonaki Saikia", line: "66 \u00b7 Gar-Ali \u00b7 lives with her daughter's family", lastReview: "Never seen here", freshShort: "8 days",
    tag: "No change", tagBg: "#E6EDE2", tagBd: "#CFDCC8", tagFg: "#3D5236",
    why: "Screened 30 August with nothing to refer. Kept so that a later change can be compared against it.",
    strip: [
      { k: "Memory", v: "Within the ordinary", sub: "Screening, 30 Aug", fg: "#3D5236" },
      { k: "Function", v: "Independent", sub: "3 observations", fg: "#3D5236" },
      { k: "Behaviour", v: "No signal", sub: "\u2014", fg: "#3D5236" },
      { k: "Measurement", v: "Good", sub: "Screening conditions good", fg: "#3D5236" },
      { k: "Open questions", v: "0", sub: "Review October, with the CHW", fg: "#241F1A" }
    ],
    cells: [{ k: "Since review", v: "No change", fg: "#3D5236" }, { k: "Function", v: "Stable", fg: "#3D5236" }, { k: "Behaviour", v: "No signal", fg: "#3D5236" }, { k: "Measurement", v: "Good", fg: "#3D5236" }, { k: "Last data", v: "30 Aug", fg: "#4A423A" }] },
  { key: "ratna", name: "Ratna Hazarika", line: "72 \u00b7 Kamalabari \u00b7 lives alone", lastReview: "Never seen here", freshShort: "\u2014",
    tag: "Consent not recorded", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A", restricted: true,
    why: "No sharing consent, so no clinical projection was built.",
    strip: [],
    cells: [{ k: "Since review", v: "Not available", fg: "#736A5E" }, { k: "Function", v: "Not available", fg: "#736A5E" }, { k: "Behaviour", v: "Not available", fg: "#736A5E" }, { k: "Measurement", v: "Not available", fg: "#736A5E" }, { k: "Last data", v: "\u2014", fg: "#736A5E" }] }
];

const AITA_CHANGES = [
  {
    id: "a1", n: "1", domain: "Acute change \u00b7 orientation, activity and sleep",
    observed: "Over two days: new confusion about where she is, activity down to roughly a third of her own usual level, and two broken nights. Her record had not moved for five months before this.",
    kind: "Acute \u00b7 L5", kindBg: "#F5E9D7", kindBd: "#E7D6BC", kindFg: "#7A4A12",
    first: "05 Sep", persistence: "48 hours, ongoing",
    grid: [
      { k: "Previous pattern", v: "Stable across 5 months, no meaningful deviation" },
      { k: "Onset", v: "Abrupt \u2014 first entry the evening of 05 Sep" },
      { k: "Evidence", v: "Person app \u00d7 2 sessions, daughter \u00d7 3 entries, CHW \u00d7 1 call" },
      { k: "Confidence", v: "Good \u2014 three independent sources agree" },
      { k: "Measurement quality", v: "Trustworthy \u2014 good audio, hearing aid in use, quiet room" },
      { k: "Not known", v: "Infection symptoms, hydration, pain, recent medication change" }
    ],
    hint: "Routed by the deterministic safety engine on onset, persistence and measurement quality. No cause has been inferred and no diagnosis proposed.",
    items: [
      { role: "Caregiver observation", src: "Silchani Marak, daughter", date: "06 Sep", quality: "Informant report, same day",
        text: "She asked twice yesterday evening whether we had moved house. She has lived here nine years. Today she stayed on the bed most of the day and would not take tea.",
        interp: "\u201cIt has suddenly got much worse.\u201d Recorded as her conclusion, not as an observation.",
        prov: [{ k: "Verification", v: "Reported" }, { k: "Occurrences", v: "3 entries" }, { k: "Recall gap", v: "Same day" }, { k: "Confidence", v: "Good" }],
        raw: "observation_id: cg_obs_7734\nperson_id: p_aita\nsource_role: CAREGIVER_OBSERVATION\nauthor: caregiver_silchani_marak\ncaptured_at: 2026-09-06T21:12+05:30\nevent_type: [disorientation_place, reduced_activity, food_refusal]\ninformant_interpretation_stored_separately: true\nmeasurement_quality: GOOD\nacute_candidate: true" },
      { role: "System-derived signal", src: "Change and context engine", date: "05\u201306 Sep", quality: "2 usable sessions, good audio",
        text: "Interaction and activity counts fell outside her own five-month range on two consecutive days, with onset inside 48 hours. The acute route was taken because the measurement was trustworthy and the deviation was abrupt, not because of the size of the deviation alone.",
        prov: [{ k: "Baseline window", v: "5 months" }, { k: "Route", v: "Deterministic safety engine" }, { k: "Model involvement", v: "None in routing" }, { k: "Relevance", v: "L5" }],
        raw: "signal_id: sig_acute_p_aita\nsignal_type: COMPOSITE.acute_change_candidate\nobservation_window: 2026-09-05/2026-09-07\nbaseline_window_days: 152\nonset_hours: 48\ndirection: decrease\npersistence_days: 2\nsources: [PERSON_APP_SESSION x2, CAREGIVER_OBSERVATION x3, CHW_CONTACT x1]\nmeasurement_quality: GOOD\nunknowns: [infection_symptoms, hydration, pain, medication_change]\nclinical_relevance: L5\nrouted_by: deterministic_safety_engine\nmodel_inference_in_routing: false\ndiagnosis_generated: none" },
      { role: "CHW observation", src: "Rimil Sangma", date: "07 Sep", quality: "Telephone, no home visit yet",
        text: "Spoke to the daughter at 08:20. Advised nothing be given beyond fluids and that the clinic would call. Could not reach the house today; visit offered for tomorrow morning.",
        prov: [{ k: "Verification", v: "Reported by phone" }, { k: "Escalation", v: "Raised to clinician" }, { k: "Home visit", v: "Not yet made" }],
        raw: "observation_id: chw_obs_9902\nsource_role: CHW_OBSERVATION\nmode: telephone\ncaptured_at: 2026-09-07T08:20+05:30\nescalation_raised: true\nescalation_target: clinician\nhome_visit_status: offered_2026-09-08" }
    ]
  }
];

const AITA_SIGNALS = [
  { name: "Orientation \u00b7 place", baseline: "0.2 /day", recent: "3.0 /day", deviation: "New pattern", pct: "82%",
    scaleLeft: "Her own 5-month range", scaleRight: "Last 2 days", bar: "#8C5715", curFg: "#7A4A12",
    rows: [{ k: "Onset", v: "48 hours" }, { k: "Observations", v: "5 across 2 sources" }, { k: "Measurement quality", v: "Good" }, { k: "Sources", v: "Caregiver, person app" }, { k: "Coincident context", v: "Not established" }, { k: "Confidence", v: "Good" }],
    status: "Urgent human clinical attention \u00b7 relevance L5", statusFg: "#7A4A12" },
  { name: "Daily activity, reported and app-derived", baseline: "Usual range 4\u20136 activities", recent: "1\u20132 activities", deviation: "Below her range", pct: "22%",
    scaleLeft: "Lower", scaleRight: "Her own range", bar: "#8C5715", curFg: "#7A4A12",
    rows: [{ k: "Onset", v: "2 days" }, { k: "Observations", v: "2 sessions, 3 caregiver entries" }, { k: "Measurement quality", v: "Good" }, { k: "Sources", v: "Person app, caregiver" }, { k: "Confidence", v: "Good" }],
    status: "Urgent human clinical attention \u00b7 relevance L5", statusFg: "#7A4A12" },
  { name: "Function \u00b7 task independence", baseline: "Independent in all recorded tasks", recent: "Not assessed since onset", deviation: "No data", pct: "0%",
    scaleLeft: "No observation since 04 Sep", scaleRight: "", bar: "#C9BCA6", curFg: "#736A5E",
    rows: [{ k: "Last verified", v: "04 Sep, CHW visit" }, { k: "Why unassessed", v: "No home visit since onset" }, { k: "Sources", v: "\u2014" }, { k: "Measurement quality", v: "Insufficient" }],
    status: "Not interpretable \u00b7 a home visit is the missing measurement", statusFg: "#736A5E" }
];

const AITA_FUNC = [
  { domain: "All recorded tasks", kind: "ADL and IADL", base: 0, cur: 0, tag: "Not assessed since onset", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A",
    cells: [{ k: "Last verified", v: "04 Sep, CHW home visit" }, { k: "Persistence", v: "Independent for 5 months to that point" }, { k: "Observed", v: "No observation since 05 Sep" }, { k: "Sources", v: "CHW \u00d7 1" }, { k: "Measurement quality", v: "Insufficient since onset" }] },
  { domain: "Eating and drinking", kind: "ADL", base: 0, cur: 1, tag: "Single report \u00b7 not established", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12",
    cells: [{ k: "First reported", v: "06 Sep" }, { k: "Persistence", v: "Reported once" }, { k: "Observed", v: "Refused tea and lunch, per her daughter" }, { k: "Sources", v: "Caregiver \u00d7 1" }, { k: "Measurement quality", v: "Report only" }] }
];

const AITA_MQ = {
  count: "2",
  tally: [
    { n: "2", label: "Interaction sessions since onset", fg: "#241F1A" },
    { n: "2", label: "Good quality", fg: "#3D5236" },
    { n: "0", label: "Moderate", fg: "#4A423A" },
    { n: "0", label: "Excluded", fg: "#4A423A" }
  ],
  suppressed: {
    title: "Nothing here is suppressed. The measurement is trustworthy, which is why this reached you as an acute change.",
    body: "Both sessions since onset had good audio, her hearing aid was in place and the room was quiet. Her daughter was present and Garo was the session language throughout. The deviation cannot be explained by the conditions of measurement, so it was routed rather than held back. What is missing is not measurement quality but a physical assessment.",
    why: [
      { k: "Audio quality", v: "Good in 2 of 2" },
      { k: "Hearing aid", v: "In use" },
      { k: "Language match", v: "Garo, matched" },
      { k: "Session time", v: "Both before 17:00" },
      { k: "ASR confidence", v: "Median 0.93" },
      { k: "Usable sample", v: "2 of 2 sessions" }
    ]
  },
  next: [
    { t: "Physical assessment, same day if possible. Infection, dehydration, pain and constipation have not been examined." },
    { t: "Confirm whether any medication changed in the last fortnight. Nothing has been reported, which is not the same as nothing having changed." },
    { t: "A CHW home visit is offered for tomorrow morning; her daughter has not confirmed." }
  ],
  factors: [
    { k: "Audio quality", v: "2 good / 0 poor", fg: "#3D5236", note: "Quiet room, daughter present, both sessions before noon." },
    { k: "Language match", v: "2 of 2 matched", fg: "#3D5236", note: "Garo throughout, her stated preference since setup." },
    { k: "Hearing support", v: "Aid in use", fg: "#3D5236", note: "In use in both sessions, so hearing does not explain the change." },
    { k: "Observation completeness", v: "Physical domains 0 of 4", fg: "#7A4A12", note: "Infection symptoms, hydration, pain and bowel or bladder change have not been asked or examined." },
    { k: "Data freshness", v: "Person data yesterday, no visit since 04 Sep", fg: "#7A4A12", note: "The most useful missing measurement is someone in the room." }
  ]
};

const AITA_EVID = [
  { label: "Person statements", dot: "#8C5715", count: "2 since onset",
    rule: "Her own words, kept first-hand. Never overwritten by an informant report or a system inference.",
    items: [
      { who: "Aita Sangma, in Garo", date: "06 Sep", text: "\u201cIs this my daughter's house or the other one? I want to lie down. My head is heavy.\u201d", meta: "Voice, translated, translation reviewed \u00b7 the phrase about her head is the only symptom she has volunteered" },
      { who: "Aita Sangma", date: "07 Sep", text: "\u201cI am tired. Do not send me anywhere today.\u201d", meta: "Recorded as her stated preference. It stands in the record alongside the clinical recommendation." }
    ] },
  { label: "Caregiver evidence \u00b7 informant", dot: "#4A6141", count: "3 since onset",
    rule: "Observation and interpretation are stored in separate fields. Only the observation feeds a signal.",
    items: [
      { who: "Silchani Marak, daughter", date: "06 Sep", text: "Asked twice whether we had moved house. She has lived here nine years.", interp: "\u201cIt has suddenly got much worse.\u201d", meta: "Corroborated by session log of the same evening" },
      { who: "Silchani Marak, daughter", date: "06 Sep", text: "Stayed on the bed most of the day. Refused tea and lunch.", interp: "\u201cShe is giving up.\u201d", meta: "First food refusal recorded in her whole record" },
      { who: "Silchani Marak, daughter", date: "07 Sep", text: "Woke three times in the night calling out. Warm to touch but we have no thermometer.", meta: "Temperature unverified \u2014 recorded as unmeasured, not as normal" }
    ] },
  { label: "CHW evidence \u00b7 field", dot: "#736A5E", count: "1 call, last visit 04 Sep",
    rule: "Structured field observation. A telephone contact is marked as such and is not treated as a home observation.",
    items: [
      { who: "Rimil Sangma \u00b7 telephone", date: "07 Sep", text: "Advised fluids and that the clinic would call. Could not reach the house today; visit offered for tomorrow morning.", meta: "Escalation raised to clinician \u00b7 no physical observation made" },
      { who: "Rimil Sangma \u00b7 home visit", date: "04 Sep", text: "Ordinary visit the day before onset. Independent in all tasks observed, cooking with her daughter, no complaints. Blood pressure 132/78.", meta: "The last measurement before the change, and the reason the deviation is so clear" }
    ] }
];

const AITA_QUESTIONS = [
  { id: "aq1", domain: "Acute change \u00b7 physical contributors", text: "Recent observations differ substantially from her own pattern with an onset inside 48 hours. Would you like a same-day physical assessment for infection, dehydration, pain or constipation before anything else is considered?",
    basis: "Orientation events 0.2 to 3.0 a day; activity below her range on 2 consecutive days; food refusal 06 Sep; unverified warmth 07 Sep; physical domains 0 of 4 assessed.", tag: "Relevance L5", tagBg: "#F5E9D7", tagBd: "#E7D6BC", tagFg: "#7A4A12" },
  { id: "aq2", domain: "Medication", text: "Nothing has been reported as changed in her medication in the last fortnight. Would you like that confirmed rather than assumed, given the abruptness?",
    basis: "No medication reconciliation event since 12 Aug. Absence of a report is not evidence of no change.", tag: "Missing data", tagBg: "#F1EADF", tagBd: "#E0D5C3", tagFg: "#4A423A" }
];

const AITA_FOLLOWUPS = [
  { id: "af1", task: "Same-day physical assessment", why: "Four physical contributors unassessed against an abrupt change", owner: "You", due: "Today" },
  { id: "af2", task: "Confirm the home visit for tomorrow morning", why: "No one has been in the room since 04 Sep", owner: "Rimil Sangma, CHW", due: "08 Sep" },
  { id: "af3", task: "Take a temperature and record fluids", why: "Warmth reported but unmeasured; food and drink refused once", owner: "Silchani Marak, daughter", due: "Today" }
];

const AITA_REPORT = (n) => ({
  footer: "Compiled 07 Sep 2026, 14:20 \u00b7 sources: 2 person-app sessions, 3 caregiver observations, 1 CHW telephone contact, 1 CHW home visit \u00b7 no clinician review held yet \u00b7 assembled for Dr. N. Choudhury \u00b7 every line traceable in the evidence appendix.",
  head: [
    { k: "Review period", v: "12 Aug \u2192 07 Sep 2026" },
    { k: "Data as of", v: "07 Sep 2026, 14:20" },
    { k: "Overall evidence", v: "Good confidence, narrow sample" },
    { k: "Sources", v: "2 person-app sessions, 3 caregiver observations, 1 CHW call, 1 CHW visit" },
    { k: "Your annotations", v: n > 0 ? n + " finding(s) reviewed by you" : "None yet \u2014 open Questions and review" }
  ],
  sections: [
    { label: "Executive summary", lead: "One acute change. Over two days her orientation to place, her activity and her sleep all moved outside a record that had been stable for five months, and she refused food once. The measurement is trustworthy, so the change cannot be attributed to session conditions. No physical assessment has been made: infection, dehydration, pain and constipation are all unexamined. Prompt clinical assessment may be appropriate.", hasRows: false, hasList: false },
    { label: "1 \u00b7 Acute change", hasRows: true, rows: [
      { k: "Fact", v: "New confusion about place, activity at roughly a third of her usual, two broken nights, one food refusal." },
      { k: "Change", v: "Onset within 48 hours from a 5-month stable record." },
      { k: "Evidence", v: "Person app \u00d7 2 sessions, daughter \u00d7 3 entries, CHW telephone \u00d7 1. The 04 Sep home visit is the last normal measurement." },
      { k: "Measurement", v: "Good \u2014 good audio, hearing aid in use, Garo throughout, both sessions before noon." },
      { k: "Her own account", v: "\u201cIs this my daughter's house or the other one? My head is heavy.\u201d 06 Sep." },
      { k: "Question", v: "Physical contributors have not been examined. Assess before anything is attributed." }
    ] },
    { label: "Not known", hasList: true, list: [
      { t: "Infection symptoms \u2014 not asked or examined. Warmth reported on 07 Sep but unmeasured." },
      { t: "Hydration \u2014 no data. One refused tea and lunch recorded." },
      { t: "Pain \u2014 not assessed. She has volunteered that her head feels heavy." },
      { t: "Medication change in the last fortnight \u2014 nothing reported, nothing confirmed." },
      { t: "Function since onset \u2014 no home visit since 04 Sep." }
    ] },
    { label: "Contradictions", hasRows: true, rows: [
      { k: "None recorded", v: "No conflicting information in this period. Her record has one informant and one field worker, both consistent." }
    ] },
    { label: "Open questions for the review", hasList: true, list: [
      { t: "Same-day physical assessment for infection, dehydration, pain and constipation." },
      { t: "Confirm rather than assume that no medication changed in the last fortnight." },
      { t: "Confirm the CHW home visit for tomorrow morning; nobody has been in the room since 04 Sep." }
    ] }
  ]
});

const PDATA = {
  nirmali: { changes: CHANGES, signals: SIGNALS, func: FUNC, mq: MQ, evid: EVID, contra: CONTRA, questions: QUESTIONS, followups: FOLLOWUPS },
  aita: { changes: AITA_CHANGES, signals: AITA_SIGNALS, func: AITA_FUNC, mq: AITA_MQ, evid: AITA_EVID, contra: [], questions: AITA_QUESTIONS, followups: AITA_FOLLOWUPS }
};

const PMETA = {
  aita: {
    period: "Screened 12 Aug \u00b7 first clinician review pending", confidence: "Good, narrow sample", questions: 2,
    changeLine: "Acute change \u00b7 onset within 48 hours \u00b7 2 open questions",
    consent: "Sharing agreed 12 Aug 2026: this clinic, her CHW, and her daughter Silchani.",
    fresh: [
      { k: "Last person interaction", v: "06 Sep, 11:40" },
      { k: "Last caregiver update", v: "07 Sep, 07:55" },
      { k: "Last CHW contact", v: "07 Sep, by phone" },
      { k: "Last CHW home visit", v: "04 Sep" }
    ],
    network: [
      { k: "Daughter, primary informant", v: "Silchani Marak" },
      { k: "Community health worker", v: "Rimil Sangma" },
      { k: "Household", v: "Daughter's family, Tura" },
      { k: "Clinician review", v: "Not yet held" }
    ],
    snapshot: [
      { k: "Acute change", v: "Orientation to place, activity and sleep all moved outside her own five-month record within 48 hours.", src: "Person app \u00d7 2, daughter \u00d7 3, CHW call \u00b7 routed L5 by the safety engine", bar: "#8C5715" },
      { k: "Measurement quality", v: "Trustworthy. Good audio, hearing aid in use, Garo throughout, both sessions before noon.", src: "Device metadata \u00b7 nothing suppressed", bar: "#C9BCA6" },
      { k: "Function", v: "Independent in every task at the CHW visit on 04 Sep. Not assessed since onset.", src: "CHW home visit, 04 Sep \u00b7 no visit since", bar: "#C9BCA6" },
      { k: "Important unknown", v: "Infection symptoms, hydration, pain and constipation are all unexamined. Warmth reported on 07 Sep but unmeasured.", src: "Physical domains 0 of 4 \u00b7 no medication reconciliation since 12 Aug", bar: "#8C5715" },
      { k: "Her own words", v: "\u201cIs this my daughter's house or the other one? My head is heavy.\u201d", src: "06 Sep, in Garo, translation reviewed", bar: "#C9BCA6" }
    ],
    unknowns: [
      { k: "Infection symptoms", v: "Not asked or examined" },
      { k: "Temperature", v: "Reported warm, unmeasured" },
      { k: "Hydration", v: "No data; one refused tea and lunch" },
      { k: "Pain", v: "Not assessed; she reports a heavy head" },
      { k: "Medication change", v: "Nothing reported, nothing confirmed" },
      { k: "Function since onset", v: "No home visit since 04 Sep" }
    ]
  },
  bhogeswar: {
    period: "No previous clinician review", confidence: "Insufficient", questions: 0,
    changeLine: "No longitudinal baseline \u00b7 referred 26 Aug, did not attend",
    consent: "Consent recorded 26 Aug 2026 with his wife present: this clinic, his CHW, his wife.",
    fresh: [{ k: "Last CHW visit", v: "02 Sep" }, { k: "Last caregiver update", v: "\u2014" }, { k: "Last person interaction", v: "No app in use" }, { k: "Last clinician review", v: "Never seen here" }],
    network: [{ k: "Wife, primary carer", v: "Sewali Nath" }, { k: "Community health worker", v: "Bhaskar Das" }, { k: "Household", v: "Lives with his wife" }],
    snapshot: [
      { k: "What exists", v: "One CHW screening on 26 Aug and one functional observation. Clear difficulty with memory and with money, described as developing over about a year.", src: "CHW screening \u00b7 measurement good", bar: "#C9BCA6" },
      { k: "What is missing", v: "No interaction sessions, so no personal baseline exists and nothing can be compared. Any change statement would be invented.", src: "0 sessions \u00b7 no baseline", bar: "#8C5715" },
      { k: "Coordination", v: "Referred here 26 Aug for the appointment of 2 Sep. Not attended. His wife has not been reachable by phone; the CHW reports transport is the usual obstacle in that ward.", src: "Referral record \u00b7 CHW note 02 Sep", bar: "#8C5715" }
    ],
    unknowns: []
  },
  hemanta: {
    period: "No previous clinician review", confidence: "Screening only", questions: 0,
    changeLine: "Mild change on screening \u00b7 referral declined, and that stands",
    consent: "Consent recorded 5 Sep 2026 for the ward self-help group only. He was clear his nephew is not to be told.",
    fresh: [{ k: "Last CHW visit", v: "05 Sep" }, { k: "Last caregiver update", v: "No caregiver" }, { k: "Last person interaction", v: "App being set up" }, { k: "Last clinician review", v: "Never seen here" }],
    network: [{ k: "Family", v: "None locally" }, { k: "Community health worker", v: "Bhaskar Das" }, { k: "Household", v: "Lives alone since his brother died" }],
    snapshot: [
      { k: "What exists", v: "One CHW screening on 5 Sep. Mild memory change, independent in daily life, no visitor in eleven days.", src: "CHW screening \u00b7 measurement good", bar: "#C9BCA6" },
      { k: "His decision", v: "He declined a clinic referral. That decision is recorded as his and has not been re-routed to you as a task.", src: "CHW note, 5 Sep \u00b7 person's own choice", bar: "#8C5715" },
      { k: "What the field worker is doing", v: "Arranging a weekly visitor through the ward self-help group. Isolation is the thing most likely to harm him first.", src: "CHW plan \u00b7 shared with the ward group by his consent", bar: "#C9BCA6" }
    ],
    unknowns: []
  },
  jonaki: {
    period: "No previous clinician review", confidence: "Screening only", questions: 0,
    changeLine: "Screened 30 Aug \u00b7 nothing to refer, kept for comparison",
    consent: "Consent recorded 30 Aug 2026. She asked that only her daughter be told.",
    fresh: [{ k: "Last CHW visit", v: "30 Aug" }, { k: "Last caregiver update", v: "30 Aug" }, { k: "Last person interaction", v: "Declined the app" }, { k: "Last clinician review", v: "Never seen here" }],
    network: [{ k: "Daughter", v: "Mridula" }, { k: "Community health worker", v: "Bhaskar Das" }, { k: "Household", v: "Daughter's family, Gar-Ali" }],
    snapshot: [
      { k: "What exists", v: "One CHW screening on 30 Aug. Memory and daily life both within what is ordinary at her age.", src: "CHW screening \u00b7 measurement good", bar: "#C9BCA6" },
      { k: "Why she is here at all", v: "The screening is kept so that a change later can be compared against something. She is not in your review queue.", src: "Baseline record only \u00b7 CHW review due October", bar: "#C9BCA6" }
    ],
    unknowns: []
  },
  ratna: {
    period: "No record", confidence: "Not available", questions: 0,
    changeLine: "Consent to share with a clinician is not recorded",
    consent: "No sharing consent recorded.",
    fresh: [], network: [], snapshot: [], unknowns: []
  }
};



export {
  LADDER,
  NIRMALI,
  CHANGES,
  SIGNALS,
  RESEARCH,
  FUNC,
  MQ,
  EVID,
  CONTRA,
  QUESTIONS,
  FOLLOWUPS,
  OTHERS,
  AITA_CHANGES,
  AITA_SIGNALS,
  AITA_FUNC,
  AITA_MQ,
  AITA_EVID,
  AITA_QUESTIONS,
  AITA_FOLLOWUPS,
  AITA_REPORT,
  PDATA,
  PMETA
};
