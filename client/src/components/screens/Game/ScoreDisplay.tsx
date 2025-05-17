// src/components/game/ScoreDisplay.tsx
import React from 'react';

interface ScoreDisplayProps {
  score: number;
  highScore: number; // Para potencialmente mostrarlo también
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, highScore }) => {
  return (
    <div className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 rounded-md z-20">
      <p className="text-cream font-luckiest text-2xl tracking-wider">
        SCORE: {Math.floor(score)}
      </p>
      {/* Podrías agregar el highScore aquí si lo deseas */}
      <p className="text-cream font-luckiest text-lg">HI: {Math.floor(highScore)}</p> 
    </div>
  );
};

export default ScoreDisplay;