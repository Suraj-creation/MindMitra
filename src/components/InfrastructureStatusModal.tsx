import React, { useState, useEffect } from "react";
import { Database, Cloud, Sparkles, CheckCircle2, AlertCircle, RefreshCw, X, Server, ShieldCheck } from "lucide-react";

interface InfrastructureData {
  timestamp: string;
  database: {
    provider: string;
    connected: boolean;
    branch: string;
    host: string;
    database: string;
    version?: string;
    tablesCount?: number;
    tables?: string[];
    latencyMs?: number;
    error?: string;
  };
  storage: {
    provider: string;
    configured: boolean;
    connected: boolean;
    bucket?: string;
    endpoint?: string;
    region?: string;
    error?: string;
    diagnostic?: string;
  };
  ai: {
    provider: string;
    configured: boolean;
    model: string;
  };
}

interface InfrastructureStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfrastructureStatusModal: React.FC<InfrastructureStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<InfrastructureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/infrastructure/status");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load infrastructure status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleRunMigration = async () => {
    setMigrating(true);
    setMigrationMessage(null);
    try {
      const res = await fetch("/api/db/migrate", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setMigrationMessage(`Schema synchronized successfully! ${result.tablesCount} tables verified.`);
        await fetchStatus();
      } else {
        setMigrationMessage(`Migration failed: ${result.message}`);
      }
    } catch (err: any) {
      setMigrationMessage(`Error: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fcfaf6] border border-[#c2c8c1] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#c2c8c1]/60 flex items-center justify-between bg-[#f4eee2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a3826] flex items-center justify-center text-white shadow-xs">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1d1c16] font-serif">Cloud Infrastructure & Telemetry</h2>
              <p className="text-xs text-[#525a54]">Neon PostgreSQL · Backblaze B2 · Google Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 rounded-lg text-[#525a54] hover:text-[#1d1c16] hover:bg-[#eae3d5] transition-colors"
              title="Refresh status"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-[#1a3826]" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#525a54] hover:text-[#1d1c16] hover:bg-[#eae3d5] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Neon DB Section */}
          <div className="border border-[#c2c8c1]/70 rounded-xl p-5 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="text-[#00e699] fill-[#00e699]/10" size={20} />
                <h3 className="font-bold text-[#1d1c16] text-sm sm:text-base">Neon Serverless PostgreSQL</h3>
              </div>
              {data?.database.connected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Live & Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle size={13} className="text-amber-600" />
                  Disconnected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f8f6f0] p-3.5 rounded-lg border border-[#c2c8c1]/40">
              <div>
                <span className="text-[#727a74] block">Endpoint / Host</span>
                <span className="font-mono text-[#1d1c16] break-all font-medium">
                  {data?.database.host || "Connecting..."}
                </span>
              </div>
              <div>
                <span className="text-[#727a74] block">Active Branch</span>
                <span className="font-medium text-[#1d1c16]">
                  {data?.database.branch || "production"} (Neon Git-style branch)
                </span>
              </div>
              <div>
                <span className="text-[#727a74] block">Database Engine</span>
                <span className="font-medium text-[#1d1c16]">
                  {data?.database.version ? data.database.version.split(" on ")[0] : "PostgreSQL 17.11"}
                </span>
              </div>
              <div>
                <span className="text-[#727a74] block">Roundtrip Latency</span>
                <span className="font-mono font-medium text-[#1a3826]">
                  {data?.database.latencyMs ? `${data.database.latencyMs} ms` : "—"}
                </span>
              </div>
            </div>

            {/* Tables Info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1d1c16] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#1a3826]" />
                  Schema Tables ({data?.database.tablesCount ?? 0} active in Neon)
                </span>
                <button
                  onClick={handleRunMigration}
                  disabled={migrating || !data?.database.connected}
                  className="text-[11px] text-[#1a3826] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  <RefreshCw size={11} className={migrating ? "animate-spin" : ""} />
                  {migrating ? "Syncing..." : "Verify & Re-sync Schema"}
                </button>
              </div>

              {migrationMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 mb-2">
                  {migrationMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#fcfaf6] rounded-lg border border-[#c2c8c1]/40">
                {data?.database.tables && data.database.tables.length > 0 ? (
                  data.database.tables.map((tbl) => (
                    <span
                      key={tbl}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-[#c2c8c1] text-[#333a34]"
                    >
                      {tbl}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#727a74] italic">No tables created yet. Click sync above.</span>
                )}
              </div>
            </div>
          </div>

          {/* Backblaze B2 Section */}
          <div className="border border-[#c2c8c1]/70 rounded-xl p-5 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cloud className="text-[#ea1f24] fill-[#ea1f24]/10" size={20} />
                <h3 className="font-bold text-[#1d1c16] text-sm sm:text-base">Backblaze B2 Object Storage</h3>
              </div>
              {data?.storage.connected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Bucket Online
                </span>
              ) : data?.storage.configured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle size={13} className="text-rose-600" />
                  Auth Failed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle size={13} className="text-amber-600" />
                  Credentials Pending
                </span>
              )}
            </div>

            <p className="text-xs text-[#525a54] leading-relaxed">
              Designated for elder archival photographs, reminiscence photo albums, and voice note recordings using Backblaze's S3-compatible API.
            </p>

            <div className="bg-[#f8f6f0] p-3.5 rounded-lg border border-[#c2c8c1]/40 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#727a74]">Target Bucket:</span>
                <span className="font-mono font-medium text-[#1d1c16]">{data?.storage.bucket || "mindmitra-elder-media"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727a74]">Endpoint Protocol:</span>
                <span className="font-mono text-[#1d1c16]">S3 API compatible</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727a74]">Current Status:</span>
                <span className="text-[#1d1c16] italic">
                  {data?.storage.connected
                    ? "Live connected to Backblaze B2"
                    : "Client SDK ready. Waiting for B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY."}
                </span>
              </div>
            </div>

            {!data?.storage.connected && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">
                      {data?.storage.configured ? "Backblaze S3 Authentication Notice" : "How to connect your Backblaze B2:"}
                    </strong>
                    {data?.storage.error && (
                      <p className="font-mono text-[11px] text-rose-800 bg-rose-50/80 p-1.5 rounded border border-rose-200 mt-1">
                        {data.storage.error}
                      </p>
                    )}
                    {data?.storage.diagnostic ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#3d2400]">
                        {data.storage.diagnostic}
                      </p>
                    ) : (
                      <p className="mt-1 leading-relaxed">
                        Provide your Backblaze B2 keys (`B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, and `B2_BUCKET_NAME`) in Settings, and the storage client will automatically connect.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Google Gemini AI */}
          <div className="border border-[#c2c8c1]/70 rounded-xl p-4 bg-white flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="text-[#1a3826]" size={18} />
              <div>
                <h4 className="font-bold text-[#1d1c16] text-xs sm:text-sm">Google Gemini 2.5 Flash</h4>
                <p className="text-[11px] text-[#525a54]">Companion voice synthesis, cognitive adaptation, and reminiscence reasoning</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={12} />
              Active
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#c2c8c1]/60 bg-[#f4eee2] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#2d5a3f] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
