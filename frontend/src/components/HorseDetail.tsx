
import React from 'react';
import type { HorseAnalysis } from '../types';
import { Card } from '../components/ui/Card';

interface ScoreProgressBarProps {
  label: string;
  score: number;
  weight: number;
}

const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ label, score, weight }) => {
  const roundedScore = Math.round(score);
  let barColor = 'bg-gray-500';
  if (roundedScore >= 90) barColor = 'bg-green-500';
  else if (roundedScore >= 80) barColor = 'bg-cyan-500';
  else if (roundedScore >= 70) barColor = 'bg-yellow-500';
  else if (roundedScore >= 50) barColor = 'bg-orange-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{label} ({weight}%)</span>
        <span className="text-sm font-bold text-white">{roundedScore}/100</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${roundedScore}%` }}></div>
      </div>
    </div>
  );
};

interface HorseDetailProps {
  horseAnalysis: HorseAnalysis;
}

export const HorseDetail: React.FC<HorseDetailProps> = ({ horseAnalysis }) => {
  const { entry, scores, extractedData, dataConfidence } = horseAnalysis;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-bold text-cyan-400">
          {entry.horseName} (#{entry.postPosition}) - Detailed Analysis
        </h4>
        <div className="text-sm text-gray-400">
            Data Confidence: <span className="font-bold text-white">{Math.round(dataConfidence * 100)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="inner">
          <h5 className="text-lg font-semibold mb-3 text-white">Score Breakdown</h5>
          <div className="space-y-4">
            <ScoreProgressBar label="Speed" score={scores.speed} weight={30} />
            <ScoreProgressBar label="Form" score={scores.form} weight={30} />
            <ScoreProgressBar label="Class" score={scores.class} weight={20} />
            <ScoreProgressBar label="Pace" score={scores.pace} weight={10} />
            <ScoreProgressBar label="Jockey" score={scores.jockey} weight={5} />
            <ScoreProgressBar label="Trainer" score={scores.trainer} weight={5} />
          </div>
        </Card>
        
        <div className="space-y-4">
          <Card variant="inner">
            <h5 className="text-lg font-semibold mb-2 text-white">Key Data Points</h5>
            <ul className="text-sm text-gray-300 space-y-1">
              <li><strong>Best Beyer Speed Figure:</strong> {extractedData.speed.bestBeyer}</li>
              <li><strong>Days Since Last Race:</strong> {extractedData.form.daysSinceLastRace}</li>
              <li><strong>Jockey Win % (Meet):</strong> {extractedData.jockey.meetWinPercent}%</li>
              <li><strong>Trainer Win % (Meet):</strong> {extractedData.trainer.meetWinPercent}%</li>
              <li><strong>Weight:</strong> {entry.weight} lbs</li>
              <li><strong>Morning Line Odds:</strong> {entry.morningLineOdds}</li>
            </ul>
          </Card>
          <Card variant="inner">
            <h5 className="text-lg font-semibold mb-2 text-white">Last 3 Beyer Figures</h5>
            <div className="flex space-x-2">
                {extractedData.speed.lastThreeBeyers.map((beyer, i) => (
                    <span key={i} className="bg-gray-700 text-white font-mono text-sm px-3 py-1 rounded-md">{beyer}</span>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
