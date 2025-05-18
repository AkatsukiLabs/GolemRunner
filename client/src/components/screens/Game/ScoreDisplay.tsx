// src/components/game/ScoreDisplay.tsx
import React from 'react';

interface ScoreDisplayProps {
  score: number;
  highScore?: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, highScore }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-surface border-4 border-primary rounded-xl px-6 py-2 flex flex-col items-center shadow-lg">
        <span className="font-luckiest text-dark text-sm leading-none">SCORE</span>
        <span className="font-bangers text-3xl text-primary tracking-wide">
          {Math.floor(score)}
        </span>
        {highScore !== undefined && (
          <span className="font-luckiest text-xs text-dark opacity-70">
            Record: {Math.floor(highScore)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreDisplay;
