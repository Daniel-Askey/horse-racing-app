
import React from 'react';
import type { AnalysisProgressState } from '../types/index';

interface AnalysisProgressProps {
  progress: AnalysisProgressState;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-3">
      <div className="flex justify-between items-center text-sm mb-1">
        <p className="font-semibold text-cyan-300">{progress.stage}</p>
        <p className="text-gray-400">{progress.details}</p>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress.percent}%` }}
        ></div>
      </div>
    </div>
  );
};
