import React, { useState, useEffect } from "react";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";

interface Props {
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
}

export const PrepareForEngine: React.FC<Props> = ({ onComplete, onBack }) => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [stepsOrder, setStepsOrder] = useState<Array<{ id: string; label: string; order: number }>>([
    { id: "step_3", label: "Crush green cardamom pod and fresh ginger", order: 3 },
    { id: "step_1", label: "Boil fresh water in the kettle", order: 1 },
    { id: "step_4", label: "Pour hot tea into traditional brass cups (ban-bhati)", order: 4 },
    { id: "step_2", label: "Add fragrant Assam CTC tea leaves", order: 2 },
  ]);
  const [isSequenceCorrect, setIsSequenceCorrect] = useState<boolean>(false);
  const [reminderSet, setReminderSet] = useState<boolean>(false);
  const [callInitiated, setCallInitiated] = useState<boolean>(false);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<GameTrialTelemetry[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentStage]);

  // Stage 1: Recognition
  const handleSelectVisitor = (id: string) => {
    const latency = Date.now() - startTime;
    const isCorrect = id === "opt_rina";
    setSelectedVisitor(id);

    setTelemetryLogs((prev) => [
      ...prev,
      {
        trial_index: prev.length + 1,
        step_name: "prepare_for_visitor_recognition",
        stimulus: "Rina vs Neighbor",
        user_selection: id,
        is_correct: isCorrect,
        latency_ms: latency,
        assistance_level: "none",
        hint_used: false,
        completion_state: isCorrect ? "success" : "assisted",
        measurement_quality_q: 0.95,
      },
    ]);
  };

  // Stage 2: Items Selection
  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  // Stage 3: Step Re-ordering
  const moveStep = (index: number, direction: "up" | "down") => {
    const newOrder = [...stepsOrder];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[target];
    newOrder[target] = temp;
    setStepsOrder(newOrder);

    // Check if order is 1 -> 2 -> 3 -> 4
    if (
      newOrder[0].id === "step_1" &&
      newOrder[1].id === "step_2" &&
      newOrder[2].id === "step_3" &&
      newOrder[3].id === "step_4"
    ) {
      setIsSequenceCorrect(true);
      const latency = Date.now() - startTime;
      setTelemetryLogs((prev) => [
        ...prev,
        {
          trial_index: prev.length + 1,
          step_name: "prepare_for_step_sequencing",
          stimulus: "4-step tea preparation sequence",
          user_selection: "water-tea-cardamom-pour",
          is_correct: true,
          latency_ms: latency,
          assistance_level: "none",
          hint_used: false,
          completion_state: "success",
          measurement_quality_q: 0.94,
        },
      ]);
    }
  };

  const handleSimulateCall = () => {
    setCallInitiated(true);
    setCallActive(true);
    setTimeout(() => {
      setCallActive(false);
    }, 6000);
  };

  const handleFinish = () => {
    onComplete(
      telemetryLogs,
      `Completed Prepare-For Visit: Recognition, Tea Sequencing, 3:45 PM Reminder, and Call to Rina.`
    );
  };

  return (
    <div id="prepare-for-engine" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header with Real-World Context */}
      <div className="bg-[#fbf7ee] border border-[#e5dac6] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#b8860b]/15 text-[#6e4e04] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Prospective Orientation & Planning
              </span>
              <span className="text-xs text-[#736a5e]">Deterministic Engine B</span>
            </div>
            <h2 className="text-2xl font-serif text-[#2c2824] mt-2 font-medium">
              Prepare-For: Afternoon Veranda Visit <span className="text-lg font-normal text-[#605546]">(প্ৰস্তুতি)</span>
            </h2>
            <p className="text-[#595043] text-sm mt-1 max-w-2xl">
              Connecting memory, executive step planning, and genuine family anticipation for Granddaughter Rina's 4:00 PM visit.
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm font-medium text-[#736a5e] hover:text-[#2c2824] border border-[#d6cbba] bg-white px-4 py-2 rounded-xl transition"
          >
            ← Back to Space
          </button>
        </div>

        {/* 6-Stage Progress Indicator */}
        <div className="mt-6 pt-4 border-t border-[#ede4d4] grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: "1. Who is coming?" },
            { num: 2, label: "2. Tea Essentials" },
            { num: 3, label: "3. Step Sequence" },
            { num: 4, label: "4. Gentle Reminder" },
            { num: 5, label: "5. Call Rina" },
          ].map((stage) => (
            <div
              key={stage.num}
              onClick={() => setCurrentStage(stage.num)}
              className={`p-2.5 rounded-xl cursor-pointer font-medium transition ${
                currentStage === stage.num
                  ? "bg-[#485935] text-white shadow-sm"
                  : currentStage > stage.num
                  ? "bg-[#eaf0e4] text-[#334224] border border-[#bdd4b0]"
                  : "bg-white text-[#736a5e] border border-[#d6cbba]"
              }`}
            >
              {stage.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── STAGE 1: VISITOR RECOGNITION ── */}
      {currentStage === 1 && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Stage 1: Person Recognition</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Someone special is visiting your veranda this afternoon. Who is coming?
            </h3>
            <p className="text-sm text-[#665c4f]">
              Look at the photograph below and select your loved one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Option A: Rina */}
            <div
              onClick={() => handleSelectVisitor("opt_rina")}
              className={`cursor-pointer rounded-2xl overflow-hidden border-2 bg-white p-4 shadow-sm transition hover:border-[#485935] ${
                selectedVisitor === "opt_rina"
                  ? "border-[#485935] ring-4 ring-[#485935]/20"
                  : "border-[#dfd4c0]"
              }`}
            >
              <div className="h-64 rounded-xl overflow-hidden bg-[#eae3d5]">
                <img
                  src="/assets/images/rina_granddaughter_portrait_1789020459100.jpg"
                  alt="Rina"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-4 text-center">
                <h4 className="text-lg font-serif font-medium text-[#2c2824]">Rina Baruah</h4>
                <p className="text-xs text-[#595043] mt-1">Your Granddaughter (Travelling from Guwahati)</p>
                <span className="inline-block mt-3 bg-[#eaf0e4] text-[#2c401e] text-xs font-semibold px-4 py-1.5 rounded-full">
                  Arriving at 4:00 PM Today
                </span>
              </div>
            </div>

            {/* Option B: Neighbour Anita */}
            <div
              onClick={() => handleSelectVisitor("opt_anita")}
              className={`cursor-pointer rounded-2xl overflow-hidden border-2 bg-white p-4 shadow-sm transition hover:border-[#dfd4c0] ${
                selectedVisitor === "opt_anita"
                  ? "border-[#9e472a] ring-4 ring-[#9e472a]/20"
                  : "border-[#dfd4c0]"
              }`}
            >
              <div className="h-64 rounded-xl overflow-hidden bg-[#eae3d5]">
                <img
                  src="/assets/images/assamese_courtyard_1788980055319.jpg"
                  alt="Neighbourhood"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-4 text-center">
                <h4 className="text-lg font-serif font-medium text-[#2c2824]">Anita Baideo</h4>
                <p className="text-xs text-[#595043] mt-1">Next door neighbour in Tezpur</p>
                <span className="inline-block mt-3 bg-[#f0e8db] text-[#595043] text-xs font-medium px-4 py-1.5 rounded-full">
                  Morning Courtyard Walk
                </span>
              </div>
            </div>
          </div>

          {selectedVisitor && (
            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentStage(2)}
                className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
              >
                Continue to Tea Essentials (Stage 2) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 2: TEA ESSENTIALS SELECTION ── */}
      {currentStage === 2 && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Stage 2: Preparation Essentials</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              What shall we prepare on the veranda tea tray for Rina?
            </h3>
            <p className="text-sm text-[#665c4f]">
              Tap the items you would like to include in this afternoon's tea service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { id: "item_ctc", title: "Assam CTC Tea Leaves", desc: "Fresh fragrant leaves from Sonitpur garden", photo: "/assets/images/assamese_tea_ceremony_1789020488707.jpg" },
              { id: "item_spices", title: "Green Cardamom & Ginger", desc: "Crushed for aromatic warmth", photo: "/assets/images/assam_tea_garden_1788977277508.jpg" },
              { id: "item_cups", title: "Brass Tea Cups (Ban-Bhati)", desc: "Traditional bell-metal ware", photo: "/assets/images/assamese_tea_ceremony_1789020488707.jpg" },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`cursor-pointer rounded-2xl border-2 p-4 bg-white shadow-sm transition ${
                  selectedItems.includes(item.id)
                    ? "border-[#485935] ring-2 ring-[#485935]/20 bg-[#f7faf4]"
                    : "border-[#dfd4c0] hover:border-[#b0a28b]"
                }`}
              >
                <div className="h-36 rounded-xl overflow-hidden bg-[#e8e0d2] mb-3">
                  <img src={item.photo} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-sm font-serif font-medium text-[#2c2824]">{item.title}</h4>
                <p className="text-xs text-[#736a5e] mt-1">{item.desc}</p>
                <div className="mt-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      selectedItems.includes(item.id)
                        ? "bg-[#485935] text-white"
                        : "bg-[#f0e8db] text-[#595043]"
                    }`}
                  >
                    {selectedItems.includes(item.id) ? "✓ Ready on Tray" : "+ Tap to Add"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 flex justify-center gap-3">
            <button
              onClick={() => setCurrentStage(3)}
              className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
            >
              Continue to Step Sequencing (Stage 3) →
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: EXECUTIVE STEP SEQUENCING ── */}
      {currentStage === 3 && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Stage 3: Executive Planning</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              What shall we do first to prepare the tea?
            </h3>
            <p className="text-sm text-[#665c4f]">
              Arrange the 4 steps in the correct order using the Move Up / Move Down buttons.
            </p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {stepsOrder.map((step, idx) => (
              <div
                key={step.id}
                className="bg-white border border-[#dfd4c0] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#b0a28b] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#f4eee2] text-[#485935] flex items-center justify-center font-bold text-sm border border-[#dfd4c0]">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-[#2c2824]">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveStep(idx, "up")}
                    disabled={idx === 0}
                    className="px-3 py-1 rounded-lg border border-[#d6cbba] bg-[#fbf7ee] text-xs font-medium disabled:opacity-30 hover:bg-[#ede3d0]"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => moveStep(idx, "down")}
                    disabled={idx === stepsOrder.length - 1}
                    className="px-3 py-1 rounded-lg border border-[#d6cbba] bg-[#fbf7ee] text-xs font-medium disabled:opacity-30 hover:bg-[#ede3d0]"
                  >
                    ↓ Down
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isSequenceCorrect ? (
            <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-2xl p-5 text-center max-w-xl mx-auto space-y-2">
              <h4 className="font-serif font-medium text-base">Perfect Tea Preparation Sequence!</h4>
              <p className="text-xs">
                1. Boil water → 2. Add tea leaves → 3. Crush cardamom & ginger → 4. Pour into traditional brass cups.
              </p>
              <button
                onClick={() => setCurrentStage(4)}
                className="mt-2 bg-[#485935] text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-[#39472a] transition"
              >
                Set Gentle Reminder (Stage 4) →
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setCurrentStage(4)}
                className="text-xs text-[#736a5e] underline underline-offset-4 hover:text-[#2c2824]"
              >
                Proceed to Reminder Step
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 4: PROSPECTIVE TABLET REMINDER ── */}
      {currentStage === 4 && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Stage 4: Prospective Reminder</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Set a Gentle Courtyard Reminder for 3:45 PM
            </h3>
            <p className="text-sm text-[#665c4f]">
              A soft chime will sound on your tablet 15 minutes before Rina arrives, so you can step onto the veranda.
            </p>
          </div>

          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 max-w-md mx-auto text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#f6efe2] border border-[#d6cbba] flex items-center justify-center mx-auto text-2xl">
              🔔
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-[#2c2824]">3:45 PM Today</span>
              <p className="text-xs text-[#736a5e] mt-1">Veranda tea with Rina (4:00 PM)</p>
            </div>

            <button
              onClick={() => setReminderSet(true)}
              disabled={reminderSet}
              className={`w-full py-3 rounded-xl font-medium text-xs transition ${
                reminderSet
                  ? "bg-[#eaf0e4] text-[#2c401e] border border-[#bdd4b0]"
                  : "bg-[#485935] text-white hover:bg-[#384629]"
              }`}
            >
              {reminderSet ? "✓ Reminder Active for 3:45 PM" : "Set Courtyard Chime Reminder"}
            </button>
          </div>

          {reminderSet && (
            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentStage(5)}
                className="bg-[#485935] text-white text-xs font-medium px-6 py-3 rounded-xl hover:bg-[#39472a] transition shadow-sm"
              >
                Connect with Rina (Stage 5) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 5: SOCIAL CONNECTION CALL ── */}
      {currentStage === 5 && (
        <div className="bg-[#faf6f0] border border-[#e8dfcf] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#7a6f5f] font-medium">Stage 5: Warm Connection</span>
            <h3 className="text-xl sm:text-2xl font-serif text-[#2c2824]">
              Send a Warm Voice Greeting to Rina
            </h3>
            <p className="text-sm text-[#665c4f]">
              Let Rina know you are looking forward to sharing tea on the veranda.
            </p>
          </div>

          <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 max-w-lg mx-auto space-y-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#e8e0d2] border border-[#dfd4c0]">
                <img
                  src="/assets/images/rina_granddaughter_portrait_1789020459100.jpg"
                  alt="Rina"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-base font-serif font-medium text-[#2c2824]">Rina Baruah (Granddaughter)</h4>
                <p className="text-xs text-[#736a5e]">+91 94350 98765 • Travelling from Guwahati</p>
              </div>
            </div>

            {callActive ? (
              <div className="bg-[#f0f7ec] border border-[#c3dfb8] rounded-xl p-4 text-center space-y-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#485935] animate-ping mr-2"></span>
                <span className="text-xs font-semibold text-[#2c401e]">Connected with Rina</span>
                <p className="text-xs text-[#415433] italic">
                  "Aitâ! I just crossed the Kaliabhomora bridge over the Brahmaputra. See you on the veranda in half an hour!"
                </p>
              </div>
            ) : (
              <button
                onClick={handleSimulateCall}
                className="w-full py-3.5 rounded-xl bg-[#485935] text-white font-medium text-xs hover:bg-[#384629] transition flex items-center justify-center gap-2 shadow-sm"
              >
                📞 Ring Rina to Say Hello
              </button>
            )}

            <div className="pt-2 border-t border-[#f0e8db] flex justify-between items-center text-xs text-[#736a5e]">
              <span>Tea Tray Prepared</span>
              <span className="font-semibold text-[#485935]">Reminder Set: 3:45 PM</span>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleFinish}
              className="bg-[#485935] text-white text-xs font-medium px-8 py-3.5 rounded-xl hover:bg-[#39472a] transition shadow-md"
            >
              Complete Preparation Journey & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
