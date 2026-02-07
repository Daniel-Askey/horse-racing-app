import * as fs from 'fs/promises';
import * as path from 'path';

// Types matching rpscrape JSON structure
export interface RpscrapeRunner {
    number: string;
    name: string;
    form: string;
    age: string;
    lbs: string;
    jockey: string;
    trainer: string;
    trainer_location: string;
    trainer_rtf: string;
    ofr: string;
    rpr: string;
    ts: string;
    last_run: string;
}

export interface RpscrapeRace {
    race_name: string;
    race_time: string;
    distance: string;
    prize: string;
    runners: RpscrapeRunner[];
}

export interface RpscrapeData {
    [region: string]: {
        [course: string]: {
            [time: string]: RpscrapeRace;
        };
    };
}

// Transformed types
export interface TransformedHorse {
    name: string;
    postPosition: number;
    jockey: string;
    trainer: string;
    morningLineOdds: string;
    age: number;
    weight: number;
    form: string;
    ratings: {
        rpr: number | null;
        ts: number | null;
        ofr: number | null;
    };
    lastRun: string;
    trainerStats: {
        rtf: number | null;
    };
}

export interface TransformedRace {
    courseName: string;
    time: string;
    raceName: string;
    distance: string;
    prize: string;
    horses: TransformedHorse[];
}

class RpscrapeService {
    private dataCache: RpscrapeData | null = null;
    private cacheDate: string | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Path to rpscrape racecards (relative to project root)
    private readonly RACECARDS_DIR = path.join(__dirname, '../../rpscrape/racecards');

    /**
     * Load rpscrape JSON for a given date
     */
    private async loadRpscrapeData(date: string): Promise<RpscrapeData> {
        const filePath = path.join(this.RACECARDS_DIR, `${date}.json`);
        
        console.log(`📂 Loading rpscrape data from: ${filePath}`);
        
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            
            console.log(`✅ Loaded rpscrape data for ${date}`);
            console.log(`   Regions: ${Object.keys(data).join(', ')}`);
            
            return data;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error(`No rpscrape data available for ${date}. Run: python3 rpscrape/scripts/racecards.py today`);
            }
            throw new Error(`Failed to load rpscrape data: ${error}`);
        }
    }

    /**
     * Get cached data or load fresh
     */
    private async getData(date: string): Promise<RpscrapeData> {
        const now = Date.now();
        
        // Return cache if valid and same date
        if (
            this.dataCache && 
            this.cacheDate === date && 
            (now - this.cacheTimestamp) < this.CACHE_TTL
        ) {
            console.log('💾 Using cached rpscrape data');
            return this.dataCache;
        }
        
        // Load fresh data
        const data = await this.loadRpscrapeData(date);
        
        this.dataCache = data;
        this.cacheDate = date;
        this.cacheTimestamp = now;
        
        return data;
    }

    /**
     * Get all available racecourses for a given date
     */
    async getAvailableCourses(date: string, region: string = 'GB'): Promise<string[]> {
        const data = await this.getData(date);
        
        const regionData = data[region];
        
        if (!regionData) {
            console.warn(`⚠️ No data for region: ${region}`);
            return [];
        }
        
        const courses = Object.keys(regionData).sort();
        
        console.log(`📍 Found ${courses.length} courses for ${region} on ${date}`);
        
        return courses;
    }

    /**
     * Get all race times for a specific course and date
     */
    async getRaceTimes(
        courseName: string, 
        date: string, 
        region: string = 'GB'
    ): Promise<Array<{ time: string; raceName: string; raceNumber: number }>> {
        const data = await this.getData(date);
        
        const courseData = data[region]?.[courseName];
        
        if (!courseData) {
            console.warn(`⚠️ No races found for ${courseName} on ${date}`);
            return [];
        }
        
        const races = Object.entries(courseData)
            .map(([time, raceData], index) => ({
                time,
                raceName: raceData.race_name,
                raceNumber: index + 1,
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
        
        console.log(`🏁 Found ${races.length} races at ${courseName}`);
        
        return races;
    }

    /**
     * Get full race details including all horses
     */
    async getRaceDetails(
        courseName: string,
        time: string,
        date: string,
        region: string = 'GB'
    ): Promise<TransformedRace> {
        const data = await this.getData(date);
        
        const race = data[region]?.[courseName]?.[time];
        
        if (!race) {
            throw new Error(`Race not found: ${courseName} at ${time} on ${date}`);
        }
        
        // Transform to standardized format
        const transformedHorses: TransformedHorse[] = race.runners.map(runner => ({
            name: runner.name,
            postPosition: parseInt(runner.number) || 0,
            jockey: runner.jockey || 'Unknown',
            trainer: runner.trainer || 'Unknown',
            morningLineOdds: 'N/A', // Not available in rpscrape
            age: parseInt(runner.age) || 0,
            weight: parseInt(runner.lbs) || 0,
            form: runner.form || '',
            ratings: {
                rpr: runner.rpr ? parseInt(runner.rpr) : null,
                ts: runner.ts ? parseInt(runner.ts) : null,
                ofr: runner.ofr ? parseInt(runner.ofr) : null,
            },
            lastRun: runner.last_run || '',
            trainerStats: {
                rtf: runner.trainer_rtf ? parseInt(runner.trainer_rtf) : null,
            },
        }));
        
        console.log(`🐴 Loaded ${transformedHorses.length} horses for ${courseName} ${time}`);
        
        return {
            courseName,
            time,
            raceName: race.race_name,
            distance: race.distance,
            prize: race.prize,
            horses: transformedHorses,
        };
    }

    /**
     * Transform to Gemini-compatible format
     */
    transformToGeminiFormat(race: TransformedRace): any[] {
        return race.horses.map(horse => ({
            horse: horse.name,
            speed: {
                bestBeyer: horse.ratings.rpr,
                bestAtDistance: horse.ratings.ts,
                lastThreeBeyers: this.parseFormToBeyers(horse.form, horse.ratings.rpr),
            },
            form: {
                lastThreeRaces: this.parseFormToRaces(horse.form, horse.lastRun),
                daysSinceLastRace: this.calculateDaysSinceLastRun(horse.lastRun),
                workouts: [], // Not available in rpscrape
            },
            jockey: {
                name: horse.jockey,
                meetWinPercent: 50, // Default
            },
            trainer: {
                name: horse.trainer,
                meetWinPercent: horse.trainerStats.rtf || 50,
            },
        }));
    }

    private parseFormToBeyers(form: string, baseFigure: number | null): number[] {
        if (!baseFigure) return [];
        
        const positions = form.split('-').map(p => parseInt(p.replace(/\D/g, ''))).filter(p => !isNaN(p));
        return positions.slice(0, 3).map(pos => Math.max(0, baseFigure - ((pos - 1) * 5)));
    }

    private parseFormToRaces(form: string, lastRun: string): any[] {
        const positions = form.split('-').map(p => {
            const match = p.match(/(\d+)/);
            return match ? parseInt(match[1]) : null;
        }).filter(p => p !== null);
        
        return positions.slice(0, 3).map((position, index) => ({
            date: lastRun || new Date().toISOString().split('T')[0],
            position: position!,
            lengthsBehind: position! === 1 ? 0 : (position! - 1) * 2.5,
            track: 'Unknown',
            distance: 'Unknown',
        }));
    }

    private calculateDaysSinceLastRun(lastRun: string): number {
        if (!lastRun) return 999;
        
        try {
            const lastRunDate = new Date(lastRun);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - lastRunDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch {
            return 999;
        }
    }
}

export const rpscrapeService = new RpscrapeService();