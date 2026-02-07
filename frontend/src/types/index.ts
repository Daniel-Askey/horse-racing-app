
export interface RaceCourse {
  name: string;
  code: string;
  location: string;
}

export interface Race {
  id: string;
  raceNumber: string;
  time: string;
  distance: string;
  surface: string;
  raceType: string;
  horseCount: number;
}

export interface HorseEntry {
  postPosition: number;
  horseName: string;
  jockey: string;
  trainer: string;
  weight: number;
  morningLineOdds: string;
}

export interface ExtractedHorseData {
  horse: string;
  speed: {
    bestBeyer: number;
    bestAtDistance: number;
    lastThreeBeyers: number[];
  };
  form: {
    lastThreeRaces: {
      date: string;
      position: number;
      lengthsBehind: number;
      track: string;
      distance: string;
    }[];
    daysSinceLastRace: number;
    workouts: {
      date: string;
      distance: string;
      timeSeconds: number;
    }[];
  };
  jockey: {
    name: string;
    meetWinPercent: number;
  };
  trainer: {
    name: string;
    meetWinPercent: number;
  };
}

// FIX: Created a dedicated interface for horse scores to ensure type safety.
export interface HorseScores {
  speed: number;
  form: number;
  class: number;
  pace: number;
  jockey: number;
  trainer: number;
  composite: number;
}

export interface HorseAnalysis {
  entry: HorseEntry;
  extractedData: ExtractedHorseData;
  // FIX: Used the new HorseScores interface for the scores property.
  scores: HorseScores;
  dataConfidence: number;
}

export interface AnalysisResults {
  course: RaceCourse;
  race: Race;
  rankedHorses: HorseAnalysis[];
  insights: string;
  analysisTimestamp: string;
}

export interface AnalysisProgressState {
    stage: 'idle' | 'Fetching entries' | 'Collecting data' | 'Analyzing statistics' | 'Ranking horses' | 'Generating insights' | 'Complete' | 'Connecting to backend' | 'Fetching race data' | 'Data collected' | 'Analyzing with AI' | 'Calculating scores';
    percent: number;
    details: string;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
