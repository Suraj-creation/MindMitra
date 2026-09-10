import React, { useEffect, useState } from "react";
import { X, Activity, ShieldCheck, Database, Clock, RefreshCw } from "lucide-react";

interface Props {
  onClose: () => void;
}

export const CognitiveTelemetryInspector: React.FC<Props> = ({ onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v1/games/experience-history?person_id=person:purnima");
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fef9f0] border border-[#d6cbba] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={22} className="text-[#1a3826]" />
            <div>
              <h2 className="text-xl font-serif text-[#1d1c16] font-bold">
                Cognitive Experience Telemetry & Audit Logs
              </h2>
              <p className="text-xs text-[#595043]">
                Zero hallucination audit trail • Neon / Postgres unified schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#d6cbba] bg-white flex items-center justify-center text-[#736a5e] hover:text-black"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-[#736a5e]">Loading telemetry records...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#736a5e] bg-white border border-[#e5dac6] rounded-2xl p-6">
              No game rounds recorded yet for this session. Play Game 7 or Game 8 to stream live audit records.
            </div>
          ) : (
            history.map((record, idx) => (
              <div
                key={record.id || idx}
                className="bg-white border border-[#dfd4c0] p-4 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a3826] uppercase tracking-wider">
                    {record.game_key}
                  </span>
                  <span className="text-[#736a5e] flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(record.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#424843]">
                  <div>
                    Type: <span className="font-semibold text-[#1d1c16]">{record.interaction_type}</span>
                  </div>
                  <div>
                    Engagement:{" "}
                    <span className="font-semibold text-[#5e6f4a]">
                      {(record.engagement_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    Recall:{" "}
                    <span className="font-semibold text-[#1d1c16]">
                      {record.recall_success ? "Success" : "Partial"}
                    </span>
                  </div>
                  <div>
                    Latency: <span className="font-semibold text-[#1d1c16]">{record.latency_ms}ms</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#736a5e] font-mono truncate">
                  Snapshot ID: {record.context_snapshot_id}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[#dfd4c0]">
          <button
            onClick={fetchTelemetry}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a3826] hover:underline"
          >
            <RefreshCw size={14} /> Refresh Logs
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1a3826] text-white text-xs font-bold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
