import React from "react";
import { GameExperienceSpecification, GameOutcome } from "../../game-runtime/types";
import { PrepareForEngine as RuntimePrepareForEngine } from "../../game-runtime/engines/PrepareForEngine";
import { personalisedPrepareForSpecLevelB } from "../../game-runtime/specs/sample-specs";
import { GameTrialTelemetry } from "../../domain/cognitive-experience";

interface Props {
  spec?: GameExperienceSpecification;
  onComplete: (telemetry: GameTrialTelemetry[], summary: string) => void;
  onBack: () => void;
}

export const PrepareForEngine: React.FC<Props> = ({ spec, onComplete, onBack }) => {
  const activeSpec = spec || personalisedPrepareForSpecLevelB;

  const handleComplete = (outcome: GameOutcome) => {
    const telemetry: GameTrialTelemetry[] = [];
    onComplete(telemetry, outcome.celebration_message);
  };

  return (
    <RuntimePrepareForEngine
      spec={activeSpec}
      onComplete={handleComplete}
      onExit={onBack}
    />
  );
};
