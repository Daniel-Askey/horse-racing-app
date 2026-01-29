export interface ExtractedHorseData {
    horse: string;
    speed: {
        bestBeyer: number | null;
        bestAtDistance: number | null;
        lastThreeBeyers: number[];
    };
    form: {
        lastThreeRaces: Array<{
            date: string;
            position: number;
            lengthsBehind: number;
            track: string;
            distance: string;
        }>;
        daysSinceLastRace: number;
        workouts: Array<{
            date: string;
            distance: string;
            timeSeconds: number;
        }>;
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

export interface RaceCourse {
    name: string;
    code?: string;
}

export interface Race {
    raceNumber: number;
    distance: string;
    surface: string;
}

export interface HorseAnalysis {
    entry: {
        horseName: string;
        postPosition: number;
        jockey: string;
        trainer: string;
    };
    scores: {
        speed: number;
        form: number;
        class: number;
        pace: number;
        jockey: number;
        trainer: number;
        composite: number;
    };
    data: ExtractedHorseData;
}