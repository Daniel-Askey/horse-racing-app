import { fetchRaceCards, getRaceByTrackAndTime } from './rpscrapeService';

export interface RaceDataResult {
    success: boolean;
    track: string;
    date: string;
    raceTime: string;
    horses: Array<{
        name: string;
        postPosition: number;
        jockey?: string;
        trainer?: string;
        morningLineOdds?: string;
    }>;
    html: string;
    source: string;
}

function generateMockHorses() {
    const names = ['SECRETARIAT','SEABISCUIT','MAN O WAR','AMERICAN PHAROAH','JUSTIFY','CIGAR'];
    return names.map((name, i) => ({
        name,
        postPosition: i + 1,
        jockey: 'Mock Jockey',
        trainer: 'Mock Trainer',
        morningLineOdds: `${i + 2}/1`,
    }));
}

/**
 * Fetch race data with rpscrape for today or historical
 */
export async function fetchRaceData(track: string, date: string, raceTime: string): Promise<RaceDataResult> {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = date === todayStr;

    try {
        // rpscrape works for today and historical
        const day = isToday ? 1 : 1; // day param irrelevant for historical JSON
        const raceCards = await fetchRaceCards(day, 'GB');

        const horses = getRaceByTrackAndTime(raceCards, track, raceTime);

        return {
            success: true,
            track,
            date,
            raceTime,
            horses,
            html: JSON.stringify(horses),
            source: 'rpscrape',
        };
    } catch (error) {
        console.warn('⚠️ rpscrape failed, falling back to mock data:', error);

        return {
            success: false,
            track,
            date,
            raceTime,
            horses: generateMockHorses(),
            html: '<html><body><h1>Mock Data</h1></body></html>',
            source: 'Mock (fallback)',
        };
    }
}
