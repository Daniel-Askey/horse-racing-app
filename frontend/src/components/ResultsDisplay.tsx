
import React, { useState } from 'react';
import type { AnalysisResults, HorseAnalysis } from '../types';
import { HorseDetail } from '../components/HorseDetail';
import { Card } from '../components/ui/Card';
import { InformationCircleIcon, ChevronDownIcon, ChevronUpIcon, TrophyIcon } from '../components/icons';

const getRankColor = (rank: number) => {
  if (rank === 1) return 'bg-green-500/20 text-green-300 border-green-500';
  if (rank === 2) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
  if (rank === 3) return 'bg-orange-500/20 text-orange-300 border-orange-500';
  return 'bg-gray-700/50 text-gray-400 border-gray-600';
};

const ScoreCell: React.FC<{ score: number }> = ({ score }) => {
  const roundedScore = Math.round(score);
  let colorClass = 'text-gray-300';
  if (roundedScore >= 90) colorClass = 'text-green-400';
  else if (roundedScore >= 80) colorClass = 'text-cyan-400';
  else if (roundedScore >= 70) colorClass = 'text-yellow-400';

  return <span className={`font-mono font-semibold ${colorClass}`}>{score.toFixed(1)}</span>;
};


export const ResultsDisplay: React.FC<{ results: AnalysisResults }> = ({ results }) => {
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);

  const toggleExpand = (postPosition: number) => {
    setExpandedHorse(expandedHorse === postPosition ? null : postPosition);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-2">
            Analysis for {results.course.name} - Race {results.race.raceNumber}
        </h2>
        <p className="text-gray-400">
            {results.race.distance} on {results.race.surface} - Analysis Date: {results.analysisTimestamp}
        </p>
      </Card>

      <Card>
         <h3 className="flex items-center text-lg font-semibold text-cyan-300 mb-3">
            <TrophyIcon className="w-5 h-5 mr-2" />
            AI-Generated Insights & Summary
        </h3>
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{results.insights}</p>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">Rank</th>
              <th scope="col" className="px-6 py-3">Horse (PP)</th>
              <th scope="col" className="px-4 py-3 text-center">Composite Score</th>
              <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Speed (30%)</th>
              <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Form (30%)</th>
              <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Class (20%)</th>
              <th scope="col" className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {results.rankedHorses.map((horse, index) => (
              <React.Fragment key={horse.entry.postPosition}>
                <tr className="border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleExpand(horse.entry.postPosition)}>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getRankColor(index + 1)}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {horse.entry.horseName} (#{horse.entry.postPosition})
                  </td>
                  <td className="px-4 py-4 text-center text-lg">
                    <ScoreCell score={horse.scores.composite} />
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                     <ScoreCell score={horse.scores.speed} />
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                     <ScoreCell score={horse.scores.form} />
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <ScoreCell score={horse.scores.class} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-gray-400 hover:text-cyan-400">
                      {expandedHorse === horse.entry.postPosition ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
                {expandedHorse === horse.entry.postPosition && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="bg-gray-900/50 p-4">
                        <HorseDetail horseAnalysis={horse} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
