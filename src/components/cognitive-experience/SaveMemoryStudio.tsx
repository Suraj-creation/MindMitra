import React, { useState, useEffect } from "react";
import { MemoryItem, TemporalFrame } from "../../domain/cognitive-experience";

interface Props {
  onClose: () => void;
  onMemoryAdded: (memory: MemoryItem) => void;
}

export const SaveMemoryStudio: React.FC<Props> = ({ onClose, onMemoryAdded }) => {
  const [roleMode, setRoleMode] = useState<"person" | "caregiver">("person");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [title, setTitle] = useState<string>("");
  const [assameseTitle, setAssameseTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [temporalFrame, setTemporalFrame] = useState<TemporalFrame>("recent");
  const [approxPeriod, setApproxPeriod] = useState<string>("Recent");
  const [culturalContext, setCulturalContext] = useState<string>("Tezpur, Assam");
  const [taggedPerson, setTaggedPerson] = useState<string>("Rina (Granddaughter)");
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceRecorded, setVoiceRecorded] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load existing memories
  useEffect(() => {
    fetch("/v1/memories")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setMemories(data.items);
      })
      .catch((err) => console.error("Error fetching memories:", err));
  }, []);

  const handleToggleRecord = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setVoiceRecorded(true);
        setVoiceTranscript("This is a photo of us having tea under the mango tree in Tezpur courtyard.");
      }, 3000);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handleSavePersonMemory = async () => {
    if (!title) {
      alert("Please give your memory a simple title.");
      return;
    }

    try {
      const res = await fetch("/v1/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: "person:purnima",
          memory_type: "autobiographical",
          title,
          description: voiceTranscript || description || "Voice memory recorded by Purnima.",
          temporal_frame: temporalFrame,
          approximate_period: approxPeriod,
          source: "person",
          verification_status: "unverified", // Starts unverified
          sensitivity: "low",
          cultural_context: culturalContext,
          media_refs: ["media:rina_portrait_2025"],
          voice_notes: voiceRecorded
            ? [
                {
                  id: `vn_${Date.now()}`,
                  speaker_name: "Purnima",
                  relationship: "self",
                  audio_url: "",
                  transcript: voiceTranscript,
                  language: "as",
                  verified: false,
                },
              ]
            : [],
        }),
      });

      const data = await res.json();
      if (data.memory) {
        onMemoryAdded(data.memory);
        setMemories((prev) => [data.memory, ...prev]);
        setStatusMessage(
          "Your memory has been safely preserved in your private album! Anu will see it to confirm before it is used in timeline games."
        );
        setTitle("");
        setDescription("");
        setVoiceRecorded(false);
      }
    } catch (err) {
      console.error("Failed to save memory:", err);
    }
  };

  const handleVerifyMemory = async (memoryId: string) => {
    try {
      const res = await fetch(`/v1/memories/${memoryId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified_by: "Anu (Primary Caregiver)",
          role: "primary_caregiver",
          relationship_note: "Verified relationship with Prabin & Tezpur family history.",
        }),
      });
      const data = await res.json();
      if (data.memory) {
        setMemories((prev) => prev.map((m) => (m.id === memoryId ? data.memory : m)));
      }
    } catch (err) {
      console.error("Error verifying memory:", err);
    }
  };

  return (
    <div id="save-memory-studio-modal" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#faf6f0] border border-[#e5dac6] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Persona Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#e5dac6]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#736a5e] font-medium">Memory Sanctuary & Provenance Store</span>
            <h2 className="text-2xl font-serif text-[#2c2824] font-medium">
              Preserve a Cherished Memory <span className="text-lg font-normal text-[#605546]">(স্মৃতি সংৰক্ষণ)</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#ede4d4] p-1 rounded-xl flex text-xs">
              <button
                onClick={() => setRoleMode("person")}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  roleMode === "person" ? "bg-[#485935] text-white shadow-sm" : "text-[#595043]"
                }`}
              >
                Purnima's Voice Mode
              </button>
              <button
                onClick={() => setRoleMode("caregiver")}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  roleMode === "caregiver" ? "bg-[#485935] text-white shadow-sm" : "text-[#595043]"
                }`}
              >
                Caregiver & Verification View
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-[#736a5e] hover:text-[#2c2824] text-lg font-bold px-3 py-1 border border-[#d6cbba] bg-white rounded-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-[#eaf0e4] border border-[#bdd4b0] text-[#2c401e] rounded-xl p-4 text-xs sm:text-sm">
            {statusMessage}
          </div>
        )}

        {/* ── PERSON SIMPLE VOICE / PHOTO RECORDING MODE ── */}
        {roleMode === "person" ? (
          <div className="space-y-6">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-serif font-medium text-[#2c2824]">
                What memory would you like to share today, Aitâ?
              </h3>

              <div>
                <label className="block text-xs font-medium text-[#595043] mb-1">Memory Title (Name of this memory)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Making Til Pitha with Rina on the Veranda"
                  className="w-full bg-[#fbf7ee] border border-[#d6cbba] rounded-xl px-4 py-3 text-sm text-[#2c2824] focus:outline-none focus:ring-2 focus:ring-[#485935]"
                />
              </div>

              {/* Voice recording button */}
              <div className="p-4 bg-[#f8f3ea] border border-[#e2d6c1] rounded-2xl text-center space-y-3">
                <span className="text-xs text-[#595043] font-medium block">
                  {voiceRecorded
                    ? "✓ Spoken story recorded safely!"
                    : isRecordingVoice
                    ? "Listening tenderly... Speak your memory story."
                    : "Tap below to speak and describe your memory"}
                </span>

                <button
                  onClick={handleToggleRecord}
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl transition shadow-md ${
                    isRecordingVoice
                      ? "bg-[#9e472a] text-white animate-pulse"
                      : voiceRecorded
                      ? "bg-[#485935] text-white"
                      : "bg-[#485935] text-white hover:bg-[#384629]"
                  }`}
                >
                  {isRecordingVoice ? "⏹" : voiceRecorded ? "✓" : "🎙"}
                </button>

                {voiceRecorded && (
                  <div className="bg-white p-3 rounded-xl border border-[#d6cbba] text-xs text-[#41382c] italic text-left">
                    "{voiceTranscript}"
                  </div>
                )}
              </div>

              {/* Period selection */}
              <div>
                <label className="block text-xs font-medium text-[#595043] mb-1">Which era does this belong to?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { frame: "childhood", label: "Childhood in Tezpur" },
                    { frame: "young_adulthood", label: "Teaching & Wedding" },
                    { frame: "later_life", label: "Family Years" },
                    { frame: "recent", label: "Recent Days with Rina" },
                  ].map((item) => (
                    <button
                      key={item.frame}
                      type="button"
                      onClick={() => setTemporalFrame(item.frame as TemporalFrame)}
                      className={`p-2.5 rounded-xl text-xs font-medium transition text-center ${
                        temporalFrame === item.frame
                          ? "bg-[#485935] text-white shadow-sm"
                          : "bg-[#fbf7ee] text-[#595043] border border-[#d6cbba]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSavePersonMemory}
                className="w-full py-3.5 rounded-xl bg-[#485935] text-white font-medium text-sm hover:bg-[#384629] transition shadow-md"
              >
                Save This Memory to My Sanctuary
              </button>
            </div>
          </div>
        ) : (
          /* ── CAREGIVER / CHW / CLINICIAN PROVENANCE & VERIFICATION VIEW ── */
          <div className="space-y-6">
            <div className="bg-white border border-[#dfd4c0] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-serif font-medium text-[#2c2824]">
                  Caregiver Provenance Manager & Memory Firewall
                </h3>
                <span className="text-xs bg-[#eaf0e4] text-[#2c401e] px-3 py-1 rounded-full font-medium">
                  Audited Database (Neon Postgres)
                </span>
              </div>
              <p className="text-xs text-[#595043]">
                Unverified claims recorded by Purnima appear here. Caregivers can verify relationships, time periods, and grant game consent scopes.
              </p>

              {/* Memory List */}
              <div className="space-y-3 pt-2">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="border border-[#e2d7c5] rounded-xl p-4 bg-[#fbf7ee] space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h4 className="font-serif font-medium text-sm text-[#2c2824]">{mem.title}</h4>
                        <span className="text-[11px] text-[#736a5e]">
                          Era: {mem.approximate_period} • Source: {mem.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            mem.verification_status === "caregiver_verified"
                              ? "bg-[#eaf0e4] text-[#2c401e] border border-[#bdd4b0]"
                              : "bg-[#faeee9] text-[#9e472a] border border-[#e5c5b9]"
                          }`}
                        >
                          {mem.verification_status === "caregiver_verified"
                            ? "✓ Caregiver Verified"
                            : "⚠ Unverified Claim"}
                        </span>
                        {mem.verification_status !== "caregiver_verified" && (
                          <button
                            onClick={() => handleVerifyMemory(mem.id)}
                            className="bg-[#485935] text-white text-xs px-3 py-1 rounded-lg hover:bg-[#384629] transition"
                          >
                            Verify & Allow for Games
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#595043] leading-relaxed">{mem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
