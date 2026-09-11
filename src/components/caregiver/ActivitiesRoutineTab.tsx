import React from "react";
import { Calendar, Sparkles, CheckCircle2, Clock, Coffee, Heart, Music, Sun, CloudRain, ShieldCheck } from "lucide-react";

export const ActivitiesRoutineTab: React.FC = () => {
  const activities = [
    {
      title: "Ancestral Photo Match (স্মৃতিৰেখা)",
      category: "Autobiographical Recall",
      duration: "14 minutes",
      time: "11:30 AM Today",
      result: "Recognized 1978 Kaziranga family photo on first prompt with warm smile.",
      effectiveCues: "Bihu flute background sound + granddaughter voice prompt.",
      status: "Completed Peacefully",
      icon: Sparkles,
    },
    {
      title: "Betel Nut Courtyard Stroll",
      category: "Sensory & Physical Mobility",
      duration: "0 min (Skipped)",
      time: "07:30 AM Today",
      result: "Consciously replaced with veranda sitting due to heavy monsoon drizzle.",
      effectiveCues: "Sitting under the bamboo awning watching the rain with warm ginger tea.",
      status: "Adapted Calmly",
      icon: CloudRain,
    },
    {
      title: "Traditional Borxongit Flute Listening",
      category: "Auditory Relaxation",
      duration: "25 minutes",
      time: "02:15 PM Today",
      result: "Settled promptly into peaceful afternoon rest. Respiration rate steady at 16 bpm.",
      effectiveCues: "Soft bamboo flute melodies at 40% volume via veranda speaker.",
      status: "Highly Effective",
      icon: Music,
    },
    {
      title: "Gosai-Ghar Evening Earthen Lamp Ritual",
      category: "Domestic Spiritual Anchor",
      duration: "Scheduled (15 min)",
      time: "06:45 PM Ahead",
      result: "Lifelong spiritual grounding ritual with daughter Anu.",
      effectiveCues: "Brass bell ringing and scent of traditional dhoop.",
      status: "Planned for Dusk",
      icon: Sun,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
            <Calendar size={14} /> Daily Living Rhythm
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#032212]">
            Activities & Routine Harmony
          </h1>
          <p className="text-xs sm:text-sm text-[#424843] mt-1 max-w-2xl leading-relaxed">
            Everyday engagement is grounded in personal familiarity, domestic tasks, and affectionate family connection. One skipped outdoor stroll is a healthy adaptation to monsoon rain, not a reason for concern.
          </p>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif text-[#032212]">
            Today’s Engagement & Meaningful Activities
          </h2>
          <span className="text-xs text-[#1a3826] bg-[#c8ebd1] px-3 py-1 rounded-full font-semibold">
            3 Completed · 1 Scheduled
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {activities.map((act, idx) => {
            const Icon = act.icon;
            return (
              <div
                key={idx}
                className="bg-[#ffffff] border border-[#c2c8c1] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#1a3826]/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#f2ede4] text-[#1a3826]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#032212]">{act.title}</h3>
                      <span className="text-[11px] text-[#727972]">{act.category}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1a3826] bg-[#f8f3ea] px-2.5 py-0.5 rounded-md border border-[#c2c8c1]/40">
                    {act.status}
                  </span>
                </div>

                <div className="text-xs space-y-2">
                  <div className="p-3 bg-[#f8f3ea] rounded-xl text-[#1d1c16]">
                    <strong>Outcome:</strong> {act.result}
                  </div>
                  <div className="p-3 bg-[#f2ede4] rounded-xl text-[#1a3826]">
                    <strong>Effective Sensory Cue:</strong> {act.effectiveCues}
                  </div>
                </div>

                <div className="text-[11px] text-[#727972] flex items-center justify-between pt-1 border-t border-[#c2c8c1]/30">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {act.time}
                  </span>
                  <span>Duration: {act.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routine Comparison: Usual Day vs. Today */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#c2c8c1]/40 pb-3">
          <h2 className="text-lg font-bold font-serif text-[#032212]">
            Usual Day vs. Today: Routine Alignment
          </h2>
          <p className="text-xs text-[#424843]">
            Comparing today’s timeline with Aitâ’s established seasonal baseline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-2xl space-y-2">
            <span className="font-bold text-[#032212] block">Usual Clear-Weather Baseline:</span>
            <ul className="space-y-1.5 text-[#424843]">
              <li>• 07:30 AM: 30-min Betel nut courtyard walk with garden flowers</li>
              <li>• 08:30 AM: Breakfast with daughter Anu and ginger tea</li>
              <li>• 04:00 PM: Veranda tea while watching the street birds</li>
              <li>• 06:45 PM: Lighting the gosai-ghar diya</li>
            </ul>
          </div>

          <div className="p-4 bg-[#f2ede4] border border-[#1a3826]/30 rounded-2xl space-y-2">
            <span className="font-bold text-[#1a3826] block">Today’s Adapted Monsoon Rhythm:</span>
            <ul className="space-y-1.5 text-[#1d1c16]">
              <li>• 07:30 AM: <em>Rain adaptation</em> — sat comfortably on veranda under awning</li>
              <li>• 08:30 AM: Kumol saul & curd enjoyed fully (85% intake)</li>
              <li>• 11:30 AM: 14-min Ancestral photo reminiscence on tablet</li>
              <li>• 04:00 PM: Upcoming warm cardamom tea in terracotta bell cup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
