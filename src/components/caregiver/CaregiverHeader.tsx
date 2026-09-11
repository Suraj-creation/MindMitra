import React from "react";
import {
  Sparkles,
  Volume2,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Clock,
  Home,
  User,
  Activity,
  Calendar,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

export type CaregiverTab =
  | "today"
  | "person-capabilities"
  | "changes-insights"
  | "activities-routine"
  | "care-tasks-alerts"
  | "reports-consult";

interface CaregiverHeaderProps {
  activeTab: CaregiverTab;
  onTabChange: (tab: CaregiverTab) => void;
  lang: "en" | "as";
  onToggleLang: () => void;
  onPlayBriefingAudio: () => void;
  isPlayingAudio: boolean;
  onOpenNotes: () => void;
  supportLevel: number;
  syncedAgo: string;
}

export const CaregiverHeader: React.FC<CaregiverHeaderProps> = ({
  activeTab,
  onTabChange,
  lang,
  onToggleLang,
  onPlayBriefingAudio,
  isPlayingAudio,
  onOpenNotes,
  supportLevel,
  syncedAgo,
}) => {
  const tabs: Array<{ id: CaregiverTab; labelEn: string; labelAs: string; icon: any }> = [
    { id: "today", labelEn: "Today", labelAs: "আজিৰ দিনটো", icon: Home },
    { id: "person-capabilities", labelEn: "Person & Capabilities", labelAs: "ব্যক্তি আৰু সামৰ্থ্য", icon: User },
    { id: "changes-insights", labelEn: "Changes & Insights", labelAs: "পৰিৱৰ্তন আৰু বিশ্লেষণ", icon: Activity },
    { id: "activities-routine", labelEn: "Activities & Routine", labelAs: "দৈনন্দিন ৰুটিন", icon: Calendar },
    { id: "care-tasks-alerts", labelEn: "Care Tasks & Alerts", labelAs: "যত্ন কাম আৰু সংকেত", icon: AlertCircle },
    { id: "reports-consult", labelEn: "Reports & Consult", labelAs: "প্ৰতিবেদন আৰু পৰামৰ্শ", icon: Stethoscope },
  ];

  return (
    <div className="bg-[#fef9f0] border-b border-[#c2c8c1]/40 pt-4 pb-0 sticky top-0 z-40 backdrop-blur-md bg-[#fef9f0]/95">
      {/* Top Identity & Action Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 pb-3">
        {/* Brand & Person Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1a3826] text-[#c8ebd1] flex items-center justify-center shadow-xs">
            <span className="font-serif font-bold text-lg">M</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#032212] font-serif">
                MindMitra Caregiver Copilot
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ffdcc3] text-[#904d00]">
                Level {supportLevel} Support
              </span>
            </div>
            <div className="text-xs text-[#424843] flex items-center gap-2">
              <span>Aitâ · Purnima Devi, Tezpur</span>
              <span className="text-[#c2c8c1]">•</span>
              <span className="flex items-center gap-1 text-[#466550] font-medium">
                <Clock size={12} /> Synced {syncedAgo} · Tezpur Home
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Vernacular Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#c2c8c1] text-[#032212] bg-[#ffffff] hover:bg-[#f8f3ea] transition-all shadow-2xs"
            title="Switch Language (অসমীয়া / English)"
          >
            <Globe size={14} className="text-[#904d00]" />
            <span>{lang === "en" ? "অসমীয়া" : "English"}</span>
          </button>

          {/* Vernacular Speech / Read Aloud */}
          <button
            onClick={onPlayBriefingAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${
              isPlayingAudio
                ? "bg-[#1a3826] text-[#ffffff] animate-pulse"
                : "border border-[#c2c8c1] text-[#032212] bg-[#ffffff] hover:bg-[#f8f3ea]"
            }`}
            title="Read aloud vernacular audio briefing"
          >
            <Volume2 size={14} className={isPlayingAudio ? "text-[#c8ebd1]" : "text-[#466550]"} />
            <span className="hidden sm:inline">
              {isPlayingAudio ? "Playing Briefing..." : lang === "as" ? "শুনক (Audio)" : "Audio Brief"}
            </span>
          </button>

          {/* Copilot Notes */}
          <button
            onClick={onOpenNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#c2c8c1] text-[#032212] bg-[#ffffff] hover:bg-[#f8f3ea] transition-all shadow-2xs"
          >
            <FileEdit size={14} className="text-[#904d00]" />
            <span className="hidden sm:inline">{lang === "as" ? "নোটসমূহ" : "Copilot Notes"}</span>
          </button>

          {/* Anu Caregiver Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#c2c8c1]/60">
            <div className="w-8 h-8 rounded-full bg-[#1a3826] text-[#c8ebd1] font-semibold flex items-center justify-center text-xs shadow-2xs">
              A
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#032212] leading-tight">Anu</div>
              <div className="text-[10px] text-[#424843]">Daughter & Primary</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-[#c2c8c1]/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  isActive
                    ? "border-[#032212] text-[#032212] bg-[#f2ede4]/70 rounded-t-xl"
                    : "border-transparent text-[#424843] hover:text-[#032212] hover:bg-[#f8f3ea]/50 rounded-t-lg"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#1a3826]" : "text-[#727972]"} />
                <span>{lang === "as" ? tab.labelAs : tab.labelEn}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
