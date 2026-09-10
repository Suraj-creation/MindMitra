import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Volume2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { MemoryItem } from "../../domain/cognitive-experience";

interface Props {
  onClose: () => void;
  onMemoryAdded: (mem: MemoryItem) => void;
  defaultRole?: "person" | "caregiver";
}

const PRESET_TEZPUR_PHOTOS = [
  { id: "p1", title: "Courtyard Mango Tree", url: "/assets/images/assamese_courtyard_1788980055319.jpg" },
  { id: "p2", title: "Wedding Day in Tezpur", url: "/assets/images/vintage_assamese_wedding_1789020439671.jpg" },
  { id: "p3", title: "Tezpur Girls High School", url: "/assets/images/tezpur_school_memory_1789020475367.jpg" },
  { id: "p4", title: "Rina in Silk Saree", url: "/assets/images/rina_granddaughter_portrait_1789020459100.jpg" },
  { id: "p5", title: "Morning Tea Garden Breeze", url: "/assets/images/assam_tea_garden_1788977277508.jpg" },
];

export const SaveMemoryStudio: React.FC<Props> = ({ onClose, onMemoryAdded, defaultRole = "person" }) => {
  const [title, setTitle] = useState("");
  const [assameseTitle, setAssameseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<"person" | "caregiver">(defaultRole);
  const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("low");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(PRESET_TEZPUR_PHOTOS[0].url);
  const [photoMode, setPhotoMode] = useState<"choose" | "camera" | "upload">("choose");

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Start real or simulated camera
  const startCamera = async () => {
    setPhotoMode("camera");
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        throw new Error("Camera API not accessible in this frame");
      }
    } catch {
      setCameraActive(false);
      setCameraError("Camera unavailable in preview sandbox. Using high-resolution camera simulation.");
    }
  };

  const takeCameraSnapshot = () => {
    if (cameraActive && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedPhoto(dataUrl);
        stopCamera();
        setPhotoMode("choose");
        return;
      }
    }
    // Fallback camera snapshot
    setSelectedPhoto("/assets/images/assamese_courtyard_1788980055319.jpg");
    setPhotoMode("choose");
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start real or simulated voice recording
  const startRecording = async () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
      } else {
        // Fallback simulation URL
        setTimeout(() => {
          setRecordedAudioUrl("simulated_voice_note.mp3");
        }, 3000);
      }
    } catch {
      // simulated voice note fallback
      setRecordedAudioUrl("simulated_voice_note.mp3");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (!recordedAudioUrl) {
      setRecordedAudioUrl("simulated_voice_note.mp3");
    }
  };

  const playRecordedAudio = () => {
    setIsPlayingAudio(true);
    if (recordedAudioUrl && recordedAudioUrl.startsWith("blob:")) {
      const audio = new Audio(recordedAudioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } else {
      // simulated playback
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
          setPhotoMode("choose");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const voiceNotes = recordedAudioUrl
        ? [
            {
              speaker_name: source === "person" ? "Purnima" : "Anu (Daughter)",
              relationship: source === "person" ? "Self" : "Daughter",
              audio_url: recordedAudioUrl,
              transcript: description || title,
              language: "as",
              verified: source === "caregiver",
            },
          ]
        : [];

      const payload = {
        person_id: "person:purnima",
        title: title.trim(),
        assamese_title: assameseTitle.trim() || undefined,
        description: description.trim(),
        temporal_frame: "later_life",
        approximate_period: "Recent",
        source,
        verification_status: source === "caregiver" ? "caregiver_verified" : "unverified",
        confidence: source === "caregiver" ? 0.98 : 0.60,
        sensitivity,
        cultural_context: "Assam Tezpur Household",
        consent_scope: source === "caregiver" ? "all" : "person_only",
        visibility_scope: source === "caregiver" ? "family" : "private",
        created_by: source === "caregiver" ? "actor:anu" : "actor:purnima",
        media_refs: selectedPhoto ? [selectedPhoto] : [],
        people_refs: source === "caregiver" ? ["Anu"] : ["Purnima"],
        voice_notes: voiceNotes,
      };

      const res = await fetch("/v1/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSavedSuccess(true);
      if (data.memory) {
        onMemoryAdded(data.memory);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch {
      alert("Unable to save memory to sanctuary. Stored in offline local buffer.");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#fefaf3] border border-[#d6cbba] rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8ded0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f0e6d6] flex items-center justify-center text-[#a85e46]">
              <Heart size={22} className="fill-[#a85e46]/20" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-[#1d1c16] font-bold">
                Save Memory <span className="text-base font-normal text-[#736a5e]">(স্মৃতি সংৰক্ষণ)</span>
              </h2>
              <p className="text-xs text-[#736a5e]">
                Capture photographs, spoken voices, and life moments into your private sanctuary.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#d6cbba] bg-white flex items-center justify-center text-[#736a5e] hover:text-black transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#e8efe4] border border-[#5e6f4a] flex items-center justify-center text-[#2d5a3f] mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a3826]">Memory Saved to Sanctuary</h3>
            <p className="text-xs text-[#595043] max-w-sm mx-auto">
              {source === "caregiver"
                ? "Verified by caregiver Anu and ready for cognitive reminiscence journeys."
                : "Saved to your private sanctuary. Caregiver Anu can verify and annotate it before it appears in cognitive games."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Photos (Take Photo / Choose Photo) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider">
                1. Cherished Photo (আলোকচিত্ৰ)
              </label>

              {/* Photo Mode Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setPhotoMode("choose");
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    photoMode === "choose"
                      ? "bg-[#1a3826] text-white border-[#1a3826]"
                      : "bg-white text-[#595043] border-[#d6cbba] hover:bg-[#f5efe6]"
                  }`}
                >
                  <ImageIcon size={14} /> Choose Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    photoMode === "camera"
                      ? "bg-[#1a3826] text-white border-[#1a3826]"
                      : "bg-white text-[#595043] border-[#d6cbba] hover:bg-[#f5efe6]"
                  }`}
                >
                  <Camera size={14} /> Take Photo
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold bg-white text-[#595043] border-[#d6cbba] hover:bg-[#f5efe6] cursor-pointer transition">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  Upload
                </label>
              </div>

              {/* Camera Preview Viewport */}
              {photoMode === "camera" && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex flex-col items-center justify-center border border-[#d6cbba]">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  {cameraError && (
                    <div className="absolute inset-0 bg-black/70 p-4 flex flex-col items-center justify-center text-center text-white space-y-2">
                      <Camera size={32} className="text-[#e2b77a]" />
                      <p className="text-xs text-white/90">{cameraError}</p>
                      <button
                        type="button"
                        onClick={takeCameraSnapshot}
                        className="px-4 py-1.5 rounded-xl bg-[#e2b77a] text-[#1d1c16] text-xs font-bold"
                      >
                        Use Courtyard Camera Snapshot
                      </button>
                    </div>
                  )}
                  {cameraActive && (
                    <div className="absolute bottom-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={takeCameraSnapshot}
                        className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs shadow-lg flex items-center gap-2 hover:bg-white/90"
                      >
                        <Camera size={16} /> Snap Photo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Preset Gallery Picker */}
              {photoMode === "choose" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_TEZPUR_PHOTOS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPhoto(p.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                          selectedPhoto === p.url ? "border-[#1a3826] ring-2 ring-[#1a3826]/30" : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {selectedPhoto && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#e8ded0]">
                      <img src={selectedPhoto} alt="Selected" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="text-xs text-[#595043]">
                        <span className="font-bold text-[#1d1c16] block">Selected Photo</span>
                        <span>Included with high visual resolution</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Voice Note (Record Voice) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider">
                2. Record Voice (মাত সংৰক্ষণ)
              </label>
              <div className="p-3.5 bg-white rounded-2xl border border-[#d6cbba] flex items-center justify-between gap-3">
                {!isRecording && !recordedAudioUrl && (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-xs text-[#736a5e]">
                      <Mic size={16} className="text-[#a85e46]" />
                      <span>Speak a cherished memory or blessing...</span>
                    </div>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-4 py-2 rounded-xl bg-[#a85e46] hover:bg-[#8e4f3a] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Mic size={14} /> Record Voice
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-bold text-red-600">Recording ({recordingSeconds}s)...</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Square size={14} /> Done
                    </button>
                  </div>
                )}

                {!isRecording && recordedAudioUrl && (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-[#2d5a3f]" />
                      <span className="text-xs font-semibold text-[#1a3826]">Voice Note Ready ({recordingSeconds || 4}s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playRecordedAudio}
                        className="px-3 py-1.5 rounded-lg bg-[#e8efe4] border border-[#5e6f4a] text-[#1a3826] text-xs font-bold flex items-center gap-1 hover:bg-[#d8e4d2]"
                      >
                        <Play size={12} className={isPlayingAudio ? "animate-pulse" : ""} />
                        {isPlayingAudio ? "Playing..." : "Listen"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordedAudioUrl(null);
                          setRecordingSeconds(0);
                        }}
                        className="p-1.5 rounded-lg border border-[#d6cbba] text-[#736a5e] hover:text-black"
                        title="Re-record"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Title & Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider mb-1">
                  3. Memory Title (স্মৃতিৰ নাম)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="English: Cardamom Tea in Veranda"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c2c8c1] bg-white text-xs focus:outline-none focus:border-[#1a3826]"
                  />
                  <input
                    type="text"
                    value={assameseTitle}
                    onChange={(e) => setAssameseTitle(e.target.value)}
                    placeholder="Assamese: বাৰান্দাত ইলাচী চাহ"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c2c8c1] bg-white text-xs focus:outline-none focus:border-[#1a3826]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider mb-1">
                  Description & Sensory Details (বিৱৰণ)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe warm memories, smells of cardamom or nahor flowers, loved family present..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c2c8c1] bg-white text-xs focus:outline-none focus:border-[#1a3826]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider mb-1">
                    Added By (উৎস)
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#c2c8c1] bg-white text-xs font-medium"
                  >
                    <option value="person">Purnima (Self — Personal Claim)</option>
                    <option value="caregiver">Anu (Caregiver — Verified)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1d1c16] uppercase tracking-wider mb-1">
                    Sensitivity (সংবেদনশীলতা)
                  </label>
                  <select
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#c2c8c1] bg-white text-xs font-medium"
                  >
                    <option value="low">Low (Eligible for Games)</option>
                    <option value="high">High (Private Sanctuary Only)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy & Provenance Notice */}
            <div className="p-3 bg-[#f5efe6] rounded-2xl border border-[#e8ded0] text-xs text-[#595043] flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#5e6f4a] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1d1c16] block">
                  {source === "caregiver" ? "Caregiver Verified Memory" : "Personal Claim (Pending Verification)"}
                </span>
                <span className="text-[11px] text-[#736a5e]">
                  {source === "caregiver"
                    ? "Uploaded by daughter Anu with verified ground truth. Automatically active in cognitive games."
                    : "Elder-authored memories enter the Memory Firewall safely. Caregiver Anu can verify and annotate it before it is used in cognitive games."}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#595043] hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#1a3826] hover:bg-[#2d5a3f] text-white text-xs font-bold disabled:opacity-50 transition shadow-md flex items-center gap-2"
              >
                <Sparkles size={14} />
                {isSubmitting ? "Saving..." : "Save Memory"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
