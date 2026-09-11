import React from "react";
import { Stethoscope, FileText, Printer, CheckCircle2, ChevronRight, ShieldCheck, Heart, Clock } from "lucide-react";

interface ReportsConsultTabProps {
  onOpenClinicalBrief: () => void;
  doctorName: string;
  appointmentDate: string;
}

export const ReportsConsultTab: React.FC<ReportsConsultTabProps> = ({
  onOpenClinicalBrief,
  doctorName,
  appointmentDate,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <Stethoscope size={14} /> Clinical Synthesis Bridge
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#032212]">
              Reports & Clinician Consult Preparation
            </h1>
            <p className="text-xs sm:text-sm text-[#424843] mt-1 max-w-2xl leading-relaxed">
              Transforming months of domestic observations into concise, actionable clinical summaries for Dr. B. K. Barua at Guwahati Neurological Center. Zero hallucinations; strictly verified data.
            </p>
          </div>
          <button
            onClick={onOpenClinicalBrief}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a3826] text-white text-xs font-semibold hover:bg-[#032212] transition-colors shadow-xs"
          >
            <Printer size={14} />
            <span>Generate Doctor's Brief</span>
          </button>
        </div>
      </div>

      {/* Doctor Consult Card Banner */}
      <div className="bg-[#ffffff] border-2 border-[#1a3826] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c2c8c1]/40 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#904d00]">
              Upcoming Neurologist Review
            </span>
            <h2 className="text-xl font-bold font-serif text-[#032212] mt-0.5">
              Consultation with {doctorName}
            </h2>
            <div className="text-xs text-[#424843] mt-1 flex items-center gap-2">
              <span>Guwahati Neurological Center</span>
              <span>•</span>
              <span className="font-semibold text-[#1a3826]">Scheduled: {appointmentDate}</span>
            </div>
          </div>

          <button
            onClick={onOpenClinicalBrief}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f8f3ea] border border-[#c2c8c1] text-[#032212] hover:bg-[#f2ede4] transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} className="text-[#904d00]" />
            <span>View 1-Page Printable Brief</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-4 bg-[#f8f3ea] rounded-2xl border border-[#c2c8c1]/60 space-y-1">
            <span className="font-bold text-[#032212] block">Medication Stability</span>
            <p className="text-[#424843] leading-relaxed">
              98.4% morning cardioprotective adherence verified by daughter Anu. Prescriptions synced in brass box.
            </p>
          </div>

          <div className="p-4 bg-[#f8f3ea] rounded-2xl border border-[#c2c8c1]/60 space-y-1">
            <span className="font-bold text-[#032212] block">Blood Pressure Vitals</span>
            <p className="text-[#424843] leading-relaxed">
              Consistently 124/80 to 128/84 mmHg across 12 checks by CHW Rumi. No hypotensive episodes.
            </p>
          </div>

          <div className="p-4 bg-[#f8f3ea] rounded-2xl border border-[#c2c8c1]/60 space-y-1">
            <span className="font-bold text-[#032212] block">Cognitive Familiarity</span>
            <p className="text-[#424843] leading-relaxed">
              Preserved recall of autobiographical memories (Kaziranga 1978). Restlessness isolated to monsoon weather.
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Digest: What Changed vs What Stayed Stable */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="border-b border-[#c2c8c1]/40 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#032212]">
              Weekly Synthesis Digest (Past 7 Days)
            </h2>
            <p className="text-xs text-[#424843]">
              Summary prepared by MindMitra governed synthesis engine.
            </p>
          </div>
          <span className="text-[11px] text-[#1a3826] font-semibold bg-[#c8ebd1] px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={13} /> Verified Integrity
          </span>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-4 bg-[#f8f3ea] border border-[#c2c8c1]/60 rounded-2xl">
            <h3 className="font-bold text-[#032212] mb-1">1. What Changed This Week?</h3>
            <p className="text-[#424843]">
              Monsoon rains in Tezpur forced morning betel courtyard walks indoors. This triggered mild evening restlessness on 3 days, which responded promptly to warm cardamom tea and traditional Borxongit flute melodies.
            </p>
          </div>

          <div className="p-4 bg-[#f2ede4] border border-[#c2c8c1]/60 rounded-2xl">
            <h3 className="font-bold text-[#1a3826] mb-1">2. What Stayed Completely Stable?</h3>
            <p className="text-[#1d1c16]">
              Appetite for traditional Assamese meals (kumol saul, curd, vegetable dal) remained robust at 85%+. Blood pressure readings remained ideal. Zero nighttime disorientation or wander episodes.
            </p>
          </div>

          <div className="p-4 bg-[#ffffff] border border-[#c2c8c1] rounded-2xl">
            <h3 className="font-bold text-[#904d00] mb-1">3. Questions to Discuss with Dr. Barua:</h3>
            <ul className="list-disc pl-4 space-y-1 text-[#424843]">
              <li>Winter season Vitamin D supplementation during rainy/overcast weeks.</li>
              <li>Maintaining the current non-pharmacological sensory grounding routine for evening relaxation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
