
import React from 'react';
import { RaceHorseIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RaceHorseIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            EquiRank <span className="text-cyan-400">AI</span>
          </h1>
        </div>
        <div className="text-xs text-gray-400">
          AI-Powered Horse Racing Analysis
        </div>
      </div>
    </header>
  );
};
