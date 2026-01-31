
import type { ExtractedHorseData, HorseScores } from '../types';

// Normalization functions (placeholders, in a real app these would be more complex)
// They scale a raw value to a 0-100 score.
const normalize = (value: number, max: number, invert: boolean = false): number => {
    const score = Math.min(Math.max(value / max, 0), 1) * 100;
    return invert ? 100 - score : score;
};

const normalizeSpeed = (data: ExtractedHorseData['speed']): number => {
    const beyerScore = normalize(data.bestBeyer, 125);
    const distanceScore = normalize(data.bestAtDistance, 120);
    const recentAverage = data.lastThreeBeyers.length > 0
        ? data.lastThreeBeyers.reduce((a, b) => a + b, 0) / data.lastThreeBeyers.length
        : 70; // Default if no data
    const recentScore = normalize(recentAverage, 120);
    return (beyerScore * 0.5) + (distanceScore * 0.2) + (recentScore * 0.3);
};

const normalizeForm = (data: ExtractedHorseData['form']): number => {
    const daysScore = normalize(data.daysSinceLastRace, 60, true); // Fewer days is better
    const recentFinishes = data.lastThreeRaces.map(r => 6 - r.position).reduce((a, b) => a + b, 0); // crude score
    const finishScore = normalize(recentFinishes, 15);
    // Workout score could be more complex, e.g., based on time for distance
    const workoutScore = data.workouts.length > 0 ? 80 : 60; 
    return (daysScore * 0.4) + (finishScore * 0.4) + (workoutScore * 0.2);
};

const normalizeClass = (): number => {
    // This would require much more data about past race classes. We'll use a random-ish score for now.
    return 75 + Math.random() * 20;
};

const normalizePace = (): number => {
    // Pace data is highly contextual. We'll use a random-ish score.
    return 70 + Math.random() * 25;
};

const normalizeJockey = (data: ExtractedHorseData['jockey']): number => {
    return normalize(data.meetWinPercent, 40);
};

const normalizeTrainer = (data: ExtractedHorseData['trainer']): number => {
    return normalize(data.meetWinPercent, 35);
};


// FIX: Corrected the return type to be the specific HorseScores interface.
export function calculateHorseScores(horseData: ExtractedHorseData): HorseScores {
  const speedScore = normalizeSpeed(horseData.speed);
  const formScore = normalizeForm(horseData.form);
  const classScore = normalizeClass(); // Placeholder
  const paceScore = normalizePace(); // Placeholder
  const jockeyScore = normalizeJockey(horseData.jockey);
  const trainerScore = normalizeTrainer(horseData.trainer);

  // Corrected weights to sum to 100% (Pace adjusted from 15% to 10%)
  const totalScore = 
    (speedScore * 0.30) +
    (formScore * 0.30) +
    (classScore * 0.20) +
    (paceScore * 0.10) + // Corrected weight
    (jockeyScore * 0.05) +
    (trainerScore * 0.05);
    
  return {
    speed: speedScore,
    form: formScore,
    class: classScore,
    pace: paceScore,
    jockey: jockeyScore,
    trainer: trainerScore,
    composite: totalScore,
  };
}
