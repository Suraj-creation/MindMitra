import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Plus, Video, Sparkles, User, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";

interface CareTasksAlertsTabProps {
  tasks: any[];
  onToggleTask: (id: string) => void;
  onPostponeTask: (id: string) => void;
  onRefresh: () => void;
}

export const CareTasksAlertsTab: React.FC<CareTasksAlertsTabProps> = ({
  tasks,
  onToggleTask,
  onPostponeTask,
  onRefresh,
}) => {
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("4:00 PM");

  const handleFeedback = (alertId: string, choice: string) => {
    setFeedbackState((prev) => ({ ...prev, [alertId]: choice }));
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffdcc3] text-[#904d00] mb-2">
              <AlertCircle size={14} /> Care Orchestration & Tasks
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#032212]">
              Care Tasks & Sparse Alerts
            </h1>
            <p className="text-xs sm:text-sm text-[#424843] mt-1 max-w-2xl leading-relaxed">
              Prioritizes only what truly matters today. Completed items are saved to the local database, and alerts never spam family members with unverified alarms.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#032212] bg-[#f8f3ea] hover:bg-[#f2ede4] transition-colors"
          >
            <RefreshCw size={14} />
            <span>Sync Tasks</span>
          </button>
        </div>
      </div>

      {/* Active Care Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif text-[#032212]">
            Remaining Care Tasks for Today ({activeTasks.length})
          </h2>
          <span className="text-xs text-[#727972]">
            {completedTasks.length} Completed
          </span>
        </div>

        <div className="space-y-3">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 sm:p-5 bg-[#ffffff] border border-[#c2c8c1] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-[#1a3826]/40 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => onToggleTask(task.id)}
                  className="w-5 h-5 rounded-md text-[#1a3826] focus:ring-[#1a3826] border-[#c2c8c1] mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#904d00]">{task.due_date_label}</span>
                    <span className="text-[#c2c8c1]">•</span>
                    <span className="text-xs text-[#727972]">Assigned to {task.assigned_to}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#032212] mt-0.5">{task.title}</h3>
                  <p className="text-xs text-[#424843] mt-1 leading-relaxed">{task.subtext}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => onPostponeTask(task.id)}
                  className="px-3 py-1.5 rounded-xl border border-[#c2c8c1] text-xs font-semibold text-[#424843] bg-[#f8f3ea] hover:bg-[#f2ede4] transition-colors"
                >
                  Postpone 30m
                </button>
                {task.category === "family" ? (
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-colors shadow-2xs"
                  >
                    <Video size={14} />
                    <span>Start Call</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#1a3826] text-white hover:bg-[#032212] transition-colors shadow-2xs"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}

          {completedTasks.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="text-xs font-bold text-[#727972] uppercase tracking-wider">
                Completed Earlier Today
              </div>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 bg-[#f8f3ea]/50 border border-[#c2c8c1]/40 rounded-xl flex items-center justify-between opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#1a3826]" />
                    <span className="text-xs text-[#032212] line-through font-medium">
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="text-[11px] text-[#727972] hover:text-[#032212] underline"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sparse Alert Feedback Module */}
      <div className="bg-[#ffffff] border border-[#c2c8c1] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="border-b border-[#c2c8c1]/40 pb-3">
          <h2 className="text-lg font-bold font-serif text-[#032212]">
            Active Attention Observation (Sparse Alert)
          </h2>
          <p className="text-xs text-[#424843]">
            Rate this alert to tune MindMitra's attention budget and eliminate alarm fatigue.
          </p>
        </div>

        <div className="p-4 bg-[#f8f3ea] border border-[#ffdcc3] rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#904d00]">Alert: 3-Day Evening Restlessness Pattern</span>
            <span className="text-[11px] text-[#727972]">Logged Today 11:30 AM</span>
          </div>
          <p className="text-xs text-[#1d1c16] leading-relaxed">
            "Activity & evening relaxation were lower than her personal baseline for the 3rd day; 2 brief sleep wakings logged."
          </p>

          <div className="pt-2 border-t border-[#c2c8c1]/40 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#424843] font-medium">Was this observation helpful to you?</span>
            <div className="flex items-center gap-2">
              {["Useful", "Expected", "Not Useful"].map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleFeedback("alert-1", choice)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    feedbackState["alert-1"] === choice
                      ? "bg-[#1a3826] text-white border-[#1a3826]"
                      : "border-[#c2c8c1] bg-white text-[#032212] hover:bg-[#f2ede4]"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          {feedbackState["alert-1"] && (
            <div className="text-[11px] text-[#1a3826] font-medium text-right pt-1">
              ✓ Thank you! Feedback recorded for attention threshold calibration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
