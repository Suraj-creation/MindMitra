import React, { useState, useEffect } from "react";
import { GameSpec, GameTrialTelemetry } from "../../domain/cognitive-experience";

interface Props {
  spec?: GameSpec;
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
}

export const MyLifeTimelineEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [activeMode, setActiveMode] = useState<"recognition" | "association" | "construction" | "voice" | "story">("recognition");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [assistanceLevel, setAssistanceLevel] = useState<"none" | "visual_cue" | "family_voice">("none");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [telemetryLogs, setTelemetryLogs] = useState<GameTrialTelemetry[]>([]);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  // Construction mode state
  const [timelineOrder, setTimelineOrder] = useState<Array<{ id: string; title: string; year: string; photo: string }>>([
    { id: "item_wedding", title: "Wedding Day in Tezpur", year: "1968", photo: "/assets/images/vintage_assamese_wedding_1789020439671.jpg" },
    { id: "item_childhood", title: "Tezpur School Days", year: "1956", photo: "/assets/images/tezpur_school_memory_1789020475367.jpg" },
    { id: "item_teaching", title: "Teaching Literature at Girls School", year: "1966", photo: "/assets/images/vintage_teacher_memory_1789020507713.jpg" },
  ]);
  const [constructionSuccess, setConstructionSuccess] = useState<boolean>(false);

  useEffect(() => {
    setStartTime(Date.now());
    setSelectedChoice(null);
    setIsCorrect(null);
    setShowHint(false);
  }, [activeMode]);

  const handleChoice = (choiceId: string) => {
    const latency = Date.now() - startTime;
    const correct = choiceId === "item_teaching"; // Teaching (1966) came before Wedding (1968)
    setSelectedChoice(choiceId);
    setIsCorrect(correct);

    const record: GameTrialTelemetry = {
      trial_index: telemetryLogs.length + 1,
      step_name: `timeline_${activeMode}`,
      stimulus: "Teaching (1966) vs Wedding (1968)",
      user_selection: choiceId,
      is_correct: correct,
      latency_ms: latency,
      assistance_level: assistanceLevel,
      hint_used: hintUsed,
      completion_state: correct ? "success" : "assisted",
      measurement_quality_q: assistanceLevel === "none" ? 0.95 : 0.85,
    };
    setTelemetryLogs((prev) => [...prev, record]);
  };

  const handlePlayFamilyVoice = () => {
    setAudioPlaying(true);
    setAssistanceLevel("family_voice");
    setHintUsed(true);
    setShowHint(true);
    setTimeout(() => {
      setAudioPlaying(false);
    }, 4000);
  };

  const handleFinish = () => {
    onComplete(
      telemetryLogs,
      `Completed My Life Timeline in ${activeMode} mode with ${telemetryLogs.length} interactions.`
    );
  };

  const moveTimelineItem = (index: number, direction: "up" | "down") => {
    const newOrder = [...timelineOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setTimelineOrder(newOrder);

    // Check if correctly ordered (1956 -> 1966 -> 1968)
    if (newOrder[0].id === "item_childhood" && newOrder[1].id === "item_teaching" && newOrder[2].id === "item_wedding") {
      setConstructionSuccess(true);
      const latency = Date.now() - startTime;
      setTelemetryLogs((prev) => [
        ...prev,
        {
          trial_index: prev.length + 1,
          step_name: "timeline_construction_completed",
          stimulus: "Three milestone chronological ordering",
          user_selection: "1956-1966-1968",
          is_correct: true,
          latency_ms: latency,
          assistance_level: assistanceLevel,
          hint_used: hintUsed,
          completion_state: "success",
          measurement_quality_q: 0.92,
        },
      ]);
    }
  };

  return (
    <div id="timeline-experience-engine" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#485935]/15 text-[#334224] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Autobiographical Reminiscence
              </span>
              <span className="text-xs text-[#736a5e]">Deterministic Engine A</span>
            </div>
            <h2 className="text-2xl font-serif text-[#2c2824] mt-2 font-medium">
              My Life Timeline <span className="text-lg font-normal text-[#605546]">(জীৱনৰ স্মৃতিৰেখা)</span>
            </h2>
            <p className="text-[#595043] text-sm mt-1 max-w-2xl">
              Grounded in your authentic photographs from Tezpur. No timers, no scores — only familiar memories and gentle family voices.
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-4 py-2 rounded-xl transition"
          >
            ← Back to Space
          </button>
        </div>

        {/* Engine Sub-mode Selector */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[#ede4d4]">
          <button
            onClick={() => setActiveMode("recognition")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              activeMode === "recognition"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f3ede1] border border-[#d6cbba]"
            }`}
          >
            Mode 1: 2-Choice Comparison (Which came first?)
          </button>
          <button
            onClick={() => setActiveMode("construction")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              activeMode === "construction"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f3ede1] border border-[#d6cbba]"
            }`}
          >
            Mode 2: Timeline Ordering (Past to Later)
          </button>
          <button
            onClick={() => setActiveMode("voice")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              activeMode === "voice"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f3ede1] border border-[#d6cbba]"
            }`}
          >
            Mode 3: Photo & Family Voice Memory
          </button>
          <button
            onClick={() => setActiveMode("story")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
              activeMode === "story"
                ? "bg-[#485935] text-white shadow-sm"
                : "bg-white text-[#595043] hover:bg-[#f3ede1] border border-[#d6cbba]"
            }`}
          >
            Mode 4: Reminiscence Story
          </button>
        </div>
      </div>

      {/* ── MODE 1: 2-CHOICE COMPARISON ── */}
      {activeMode === "recognition" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Gentle Orientation</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Which treasured milestone came earlier in your life, Aitâ?
            </h3>
            <p className="text-sm text-[#665c4f]">
              Look at the two photographs below. Tap the moment that happened first.
            </p>
          </div>

          {/* Scaffolding Bar */}
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={handlePlayFamilyVoice}
              disabled={audioPlaying}
              className="inline-flex items-center gap-2 bg-[#f0e8db] hover:bg-[#e8decb] text-[#41382c] border border-[#d6cbba] text-xs font-medium px-4 py-2 rounded-full transition"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#485935] animate-pulse"></span>
              {audioPlaying ? "Playing Daughter Anu's Voice..." : "Hear Daughter Anu's Gentle Clue"}
            </button>
            <button
              onClick={() => {
                setShowHint(!showHint);
                setAssistanceLevel("visual_cue");
                setHintUsed(true);
              }}
              className="text-xs font-medium text-[#736a5e] hover:text-[#2c2824] underline underline-offset-4"
            >
              {showHint ? "Hide Clue" : "Show Gentle Clue"}
            </button>
          </div>

          {showHint && (
            <div className="bg-[#f2ecde] border border-[#dfd4c0] rounded-xl p-4 text-center max-w-lg mx-auto text-xs sm:text-sm text-[#453d33]">
              <strong>Anu (Daughter):</strong> "Ma, you started teaching literature at Tezpur Girls School in 1966, right before you and Baba had your wedding in 1968."
            </div>
          )}

          {/* Two Large Photographic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-2">
            {/* Card A: Teaching */}
            <div
              onClick={() => handleChoice("item_teaching")}
              className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition duration-200 transform hover:-translate-y-1 bg-white shadow-sm flex flex-col ${
                selectedChoice === "item_teaching"
                  ? "border-[#485935] ring-4 ring-[#485935]/20"
                  : "border-[#dfd3bf] hover:border-[#b0a28b]"
              }`}
            >
              <div className="h-64 w-full bg-[#eae3d5] overflow-hidden relative">
                <img
                  src="/assets/images/vintage_teacher_memory_1789020507713.jpg"
                  alt="Teaching Literature in Tezpur"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-3 left-3 bg-[#2c2824]/80 backdrop-blur-sm text-[#f5ebd7] text-xs px-3 py-1 rounded-full font-serif">
                  Tezpur Girls High School
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-lg font-serif font-medium text-[#2c2824]">
                    Teaching Literature <span className="text-sm font-normal text-[#736a5e]">(১৯৬৬)</span>
                  </h4>
                  <p className="text-xs text-[#595043] mt-1">
                    Your first literature classes with bright school students in Tezpur.
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-full py-3 rounded-xl font-medium text-sm transition ${
                    selectedChoice === "item_teaching"
                      ? "bg-[#485935] text-white"
                      : "bg-[#f4eee2] text-[#41382c] hover:bg-[#eae1d0]"
                  }`}
                >
                  This came earlier
                </button>
              </div>
            </div>

            {/* Card B: Wedding */}
            <div
              onClick={() => handleChoice("item_wedding")}
              className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition duration-200 transform hover:-translate-y-1 bg-white shadow-sm flex flex-col ${
                selectedChoice === "item_wedding"
                  ? isCorrect === false
                    ? "border-[#9e472a] ring-4 ring-[#9e472a]/20"
                    : "border-[#485935]"
                  : "border-[#dfd3bf] hover:border-[#b0a28b]"
              }`}
            >
              <div className="h-64 w-full bg-[#eae3d5] overflow-hidden relative">
                <img
                  src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                  alt="Wedding in Tezpur"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-3 left-3 bg-[#2c2824]/80 backdrop-blur-sm text-[#f5ebd7] text-xs px-3 py-1 rounded-full font-serif">
                  Wedding in Tezpur
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-lg font-serif font-medium text-[#2c2824]">
                    Wedding Day <span className="text-sm font-normal text-[#736a5e]">(১৯৬৮)</span>
                  </h4>
                  <p className="text-xs text-[#595043] mt-1">
                    Your wedding ceremony surrounded by singing family and muga silk.
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-full py-3 rounded-xl font-medium text-sm transition ${
                    selectedChoice === "item_wedding"
                      ? "bg-[#9e472a] text-white"
                      : "bg-[#f4eee2] text-[#41382c] hover:bg-[#eae1d0]"
                  }`}
                >
                  This came earlier
                </button>
              </div>
            </div>
          </div>

          {/* Feedback & Celebration Banner */}
          {selectedChoice && (
            <div
              className={`rounded-2xl p-6 text-center max-w-xl mx-auto space-y-3 transition duration-300 ${
                isCorrect
                  ? "bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e]"
                  : "bg-[#faeee9] border border-[#e5c5b9] text-[#5e2918]"
              }`}
            >
              <h4 className="text-lg font-serif font-medium">
                {isCorrect ? "Wonderful, Aitâ!" : "Such a lovely memory to reflect on."}
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                {isCorrect
                  ? "You began teaching literature in 1966, two years before your beautiful wedding in 1968. Both memories remain radiant milestones of your life in Tezpur."
                  : "Your wedding was celebrated in 1968, shortly after you began teaching literature at the Girls School in 1966."}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveMode("construction")}
                  className="bg-[#485935] text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-[#39472a] transition"
                >
                  Continue to Timeline Ordering →
                </button>
                <button
                  onClick={handleFinish}
                  className="bg-white border border-[#c2b6a3] text-[#41382c] text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#f7f2ea] transition"
                >
                  Save & Complete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: TIMELINE ORDERING (CONSTRUCTION) ── */}
      {activeMode === "construction" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Tactile Placement</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Arrange Your Cherished Journey from Earliest to Later
            </h3>
            <p className="text-sm text-[#665c4f]">
              Use the simple Move Up / Move Down buttons to place your childhood school days first, followed by teaching and wedding.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {timelineOrder.map((item, index) => (
              <div
                key={item.id}
                className="bg-white border border-[#dfd4c0] rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-[#baa890] transition"
              >
                <div className="w-10 h-10 rounded-full bg-[#f4eee2] text-[#485935] flex items-center justify-center font-serif text-lg font-bold border border-[#dfd4c0]">
                  {index + 1}
                </div>
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#e8e0d2] flex-shrink-0 border border-[#dfd4c0]">
                  <img src={item.photo} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-serif font-medium text-[#2c2824] truncate">{item.title}</h4>
                  <p className="text-xs text-[#736a5e] mt-0.5">Approximate Era: {item.year}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => moveTimelineItem(index, "up")}
                    disabled={index === 0}
                    className="px-3 py-1.5 rounded-lg border border-[#d6cbba] bg-[#fbf7ee] text-[#41382c] text-xs font-medium disabled:opacity-30 hover:bg-[#ede3d0] transition"
                  >
                    ↑ Move Up
                  </button>
                  <button
                    onClick={() => moveTimelineItem(index, "down")}
                    disabled={index === timelineOrder.length - 1}
                    className="px-3 py-1.5 rounded-lg border border-[#d6cbba] bg-[#fbf7ee] text-[#41382c] text-xs font-medium disabled:opacity-30 hover:bg-[#ede3d0] transition"
                  >
                    ↓ Move Down
                  </button>
                </div>
              </div>
            ))}
          </div>

          {constructionSuccess && (
            <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-2xl p-6 text-center max-w-xl mx-auto space-y-3">
              <h4 className="text-lg font-serif font-medium">Perfect Chronological Harmony, Aitâ!</h4>
              <p className="text-xs sm:text-sm">
                1956 School Days → 1966 Literature Teaching → 1968 Tezpur Wedding. You have ordered these three precious chapters flawlessly.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveMode("voice")}
                  className="bg-[#485935] text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-[#39472a] transition"
                >
                  Listen to Family Voice Memory →
                </button>
                <button
                  onClick={handleFinish}
                  className="bg-white border border-[#c2b6a3] text-[#41382c] text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-[#f7f2ea] transition"
                >
                  Save & Return
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 3: PHOTO & FAMILY VOICE MEMORY ── */}
      {activeMode === "voice" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Auditory & Visual Resonance</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Family Voice Notes with Archival Photographs
            </h3>
            <p className="text-sm text-[#665c4f]">
              Hear tender spoken reflections recorded by your daughter Anu and granddaughter Rina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Memory 1 */}
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="h-52 w-full rounded-xl overflow-hidden bg-[#e8e0d2]">
                <img
                  src="/assets/images/vintage_assamese_wedding_1789020439671.jpg"
                  alt="Wedding memory"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#485935]">1968 • Tezpur Courtyard</span>
                <h4 className="text-base font-serif font-medium text-[#2c2824]">Wedding Ceremony with Prabin Baruah</h4>
              </div>
              <div className="bg-[#f7f2e8] border border-[#e2d7c5] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#595043]">
                  <span className="font-semibold text-[#2c2824]">Voice Note: Anu (Daughter)</span>
                  <span>0:18 • Assamese</span>
                </div>
                <p className="text-xs text-[#595043] italic">
                  "Ma, Baba's smile in this wedding photo under the courtyard awning is always so radiant. You both wore traditional Muga silk."
                </p>
                <button
                  onClick={handlePlayFamilyVoice}
                  className="w-full py-2.5 rounded-lg bg-[#485935] text-white text-xs font-medium hover:bg-[#384629] transition flex items-center justify-center gap-2"
                >
                  ▶ Listen to Anu's Voice
                </button>
              </div>
            </div>

            {/* Memory 2 */}
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="h-52 w-full rounded-xl overflow-hidden bg-[#e8e0d2]">
                <img
                  src="/assets/images/vintage_teacher_memory_1789020507713.jpg"
                  alt="Teaching memory"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#485935]">1966 - 1998 • Tezpur Girls High School</span>
                <h4 className="text-base font-serif font-medium text-[#2c2824]">Thirty Years of Teaching Literature</h4>
              </div>
              <div className="bg-[#f7f2e8] border border-[#e2d7c5] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#595043]">
                  <span className="font-semibold text-[#2c2824]">Voice Note: Rina (Granddaughter)</span>
                  <span>0:14 • Assamese</span>
                </div>
                <p className="text-xs text-[#595043] italic">
                  "Aitâ, so many people in Tezpur still remember your wonderful recitation of Laxminath Bezbaroa's poems!"
                </p>
                <button
                  onClick={handlePlayFamilyVoice}
                  className="w-full py-2.5 rounded-lg bg-[#485935] text-white text-xs font-medium hover:bg-[#384629] transition flex items-center justify-center gap-2"
                >
                  ▶ Listen to Rina's Voice
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleFinish}
              className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
            >
              Complete Reminiscence Session
            </button>
          </div>
        </div>
      )}

      {/* ── MODE 4: REMINISCENCE STORY ── */}
      {activeMode === "story" && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Life Story Narrative</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              The Story of Purnima Baideu
            </h3>
            <p className="text-sm text-[#665c4f]">
              A peaceful narrative grounded in your hometown of Tezpur.
            </p>
          </div>

          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-5 text-[#3a332a] leading-relaxed text-sm sm:text-base font-serif">
            <p>
              By the gentle banks of the Brahmaputra in Tezpur, morning breezes carry the fragrance of tea gardens and riverside Nahor blossoms. Here, in a quiet heritage classroom, you sat with your slate board, reciting early verses with friends.
            </p>
            <p>
              Years later, you walked through the gates of Tezpur Girls High School not as a student, but as a beloved teacher of Assamese literature. For thirty years, your students listened intently as you brought poetry and stories to life.
            </p>
            <p>
              In 1968, the courtyard of your family home was decorated for your wedding to Prabin Baruah. Relatives sang traditional Biya Naam, and laughter echoed across the veranda.
            </p>
            <div className="p-4 bg-[#f6efe2] rounded-xl border border-[#e2d6c1] text-xs font-sans text-[#5c5243] flex items-center justify-between">
              <span>Verified Life Story Narrative • Grounded in Family Archives</span>
              <span className="font-semibold text-[#485935]">Preserved by Anu (Daughter)</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleFinish}
              className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
            >
              Return to Cognitive Space
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
