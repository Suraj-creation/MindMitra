import React, { useState } from "react";
import { X, Printer, Download, Check, Stethoscope, ShieldCheck, Heart } from "lucide-react";

interface ClinicalBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
}

export const ClinicalBriefModal: React.FC<ClinicalBriefModalProps> = ({
  isOpen,
  onClose,
  patientName,
  doctorName,
  appointmentDate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `
MINDMITRA CLINICAL BRIEF
Patient: ${patientName} (Age 74) · Tezpur, Sonitpur, Assam
Consultant: ${doctorName} · Guwahati Neurological Center
Appointment Date: ${appointmentDate}
Review Period: June 2026 – September 2026

KEY OBJECTIVE FINDINGS:
1. Cardioprotective medication adherence: 98.4% verified by primary caregiver Anu.
2. Blood Pressure Stability: Range 124/80 to 128/84 mmHg across 12 verified checks.
3. Autobiographical Recall: Intact recognition of 1978 Kaziranga family photo with 100% precision.
4. Evening Restlessness: Mild, situational only (confined by monsoon rains). Zero wandering or nocturnal distress.
5. Functional Independence: Feeds independently, enjoys Assamese kumol saul and curd, participates in gosai-ghar domestic rituals.

CURRENT OPERATIONAL SCAFFOLDING:
Level 2 (Guided Routine Support) set by family caregiver Anu.

NOTE FOR CONSULT:
Caregiver requests Dr. Barua's confirmation on winter vitamin D supplementation. Zero pharmacological escalations suggested by AI.
    `.trim();

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#032212]/50 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#c2c8c1]/40 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <Stethoscope size={14} /> Clinical Neurologist Bridge
            </div>
            <h2 className="text-xl font-bold font-serif text-[#032212]">
              Clinical Consultation Brief for {doctorName}
            </h2>
            <p className="text-xs text-[#424843] mt-1">
              Quarterly review at Guwahati Neurological Center · Confirmed for {appointmentDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f2ede4] text-[#424843] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Document Preview */}
        <div className="p-6 bg-[#f8f3ea] border border-[#c2c8c1] rounded-2xl space-y-5 font-sans">
          <div className="flex items-center justify-between border-b border-[#c2c8c1]/60 pb-3">
            <div>
              <div className="font-serif font-bold text-base text-[#032212]">MindMitra Clinical Summary</div>
              <div className="text-[11px] text-[#424843]">Tezpur District Healthcare Network · ABHA / Tele-MANAS Aligned</div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a3826] bg-[#c8ebd1] px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified Data
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#727972] block">Patient Name:</span>
              <strong className="text-[#032212] font-semibold">{patientName} (Age 74)</strong>
            </div>
            <div>
              <span className="text-[#727972] block">Primary Caregiver:</span>
              <strong className="text-[#032212] font-semibold">Anu (Daughter)</strong>
            </div>
            <div>
              <span className="text-[#727972] block">Current Care Guide:</span>
              <strong className="text-[#904d00] font-semibold">Level 2 (Guided Routine Support)</strong>
            </div>
            <div>
              <span className="text-[#727972] block">Review Period:</span>
              <strong className="text-[#032212] font-semibold">Past 90 Days (Q3 2026)</strong>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#c2c8c1]/40">
            <div className="text-xs font-bold uppercase tracking-wider text-[#032212]">
              5 Compressed Clinical Findings (Zero AI Speculation):
            </div>
            <ul className="space-y-2 text-xs text-[#1d1c16] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3826] mt-1.5 shrink-0" />
                <span><strong>Cardioprotective medication adherence:</strong> 98.4% verified by primary caregiver Anu. Prescriptions logged in brass box without missed doses.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3826] mt-1.5 shrink-0" />
                <span><strong>Blood Pressure Stability:</strong> 124/80 to 128/84 mmHg across 12 weekly measurements by CHW Rumi. Zero hypertensive spikes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3826] mt-1.5 shrink-0" />
                <span><strong>Autobiographical Recall:</strong> Recognized 1978 Kaziranga family photograph with 100% precision. Preserved long-term autobiographical anchor.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3826] mt-1.5 shrink-0" />
                <span><strong>Evening Restlessness:</strong> Mild, situational only (confined indoors by continuous monsoon rains). Fully responsive to cardamom tea and Borxongit flute melodies. Zero wandering attempts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a3826] mt-1.5 shrink-0" />
                <span><strong>Functional Independence:</strong> Feeds independently, enjoys Assamese kumol saul and curd, participates in gosai-ghar domestic prayers.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-[#424843]">
            Compliant with Indian National Mental Health & Tele-MANAS guidelines.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[#c2c8c1] bg-white hover:bg-[#f8f3ea] text-[#032212] transition-colors"
            >
              {copied ? <Check size={14} className="text-[#1a3826]" /> : <Download size={14} />}
              <span>{copied ? "Copied Text" : "Copy Digest"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-all shadow-xs"
            >
              <Printer size={14} />
              <span>Print Brief for Clinic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
