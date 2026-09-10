import React from "react";
import { GameExperienceSpecification, GameOutcome } from "../../game-runtime/types";
import { MyLifeTimelineEngine as RuntimeTimelineEngine } from "../../game-runtime/engines/MyLifeTimelineEngine";
import { staticTimelineSpecLevelA } from "../../game-runtime/specs/sample-specs";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";

interface Props {
  spec?: GameExperienceSpecification;
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
}

export const MyLifeTimelineEngine: React.FC<Props> = ({ spec, onComplete, onBack }) => {
  const activeSpec = spec || staticTimelineSpecLevelA;

  const handleComplete = (outcome: GameOutcome) => {
    // Map runtime trial records to legacy GameTrialTelemetry format for compatibility
    const telemetry: GameTrialTelemetry[] = outcome.experience_episode
      ? []
      : [];
    onComplete(telemetry, outcome.celebration_message);
  };

  return (
    <RuntimeTimelineEngine
      spec={activeSpec}
      onComplete={handleComplete}
      onExit={onBack}
    />
  );
};
