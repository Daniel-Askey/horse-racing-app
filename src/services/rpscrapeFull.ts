/**
 * Full rpscrape integration for detailed historical data
 * Uses rpscrape.py to fetch complete race results for individual horses
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface DetailedRaceResult {
    date: string;
    course: string;
    distance: string;
    going: string;
    raceClass: string;
    raceType: string;
    position: number;
    totalRunners: number;
    beatenLengths: number;
    weight: number;
    officialRating: number;
    jockey: string;
    trainer: string;
    sp: string;
    prize: string;
    comment: string;
}

export interface HorseHistoryData {
    horseName: string;
    races: DetailedRaceResult[];
    currentRating: number;
    totalRuns: number;
    wins: number;
    places: number;
}

class RpscrapeFull {
    // FIX: Use absolute path to rpscrape inside project
    private readonly RPSCRAPE_DIR = path.resolve(__dirname, '../../rpscrape');
    private readonly CACHE_DIR = path.join(this.RPSCRAPE_DIR, 'cache', 'horses');
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        this.ensureCacheDir();
    }

    private async ensureCacheDir() {
        try {
            await fs.mkdir(this.CACHE_DIR, { recursive: true });
            console.log(`📁 Cache directory: ${this.CACHE_DIR}`);
        } catch (error) {
            console.warn('⚠️ Could not create cache directory:', error);
        }
    }

    async getHorseHistory(
        horseName: string,
        region: string = 'gb',
        maxRaces: number = 10
    ): Promise<HorseHistoryData | null> {
        console.log(`📊 Fetching history for ${horseName}...`);

        // Check cache first
        const cached = await this.getCachedHistory(horseName);
        if (cached) {
            console.log(`💾 Using cached data for ${horseName}`);
            return cached;
        }

        // Fetch from rpscrape
        try {
            const history = await this.fetchFromRpscrape(horseName, region, maxRaces);
            
            if (history) {
                await this.cacheHistory(horseName, history);
            }
            
            return history;
        } catch (error) {
            console.error(`❌ Failed to fetch history for ${horseName}:`, error);
            return null;
        }
    }

    async getMultipleHorseHistories(
        horseNames: string[],
        region: string = 'gb'
    ): Promise<Map<string, HorseHistoryData | null>> {
        console.log(`📊 Fetching history for ${horseNames.length} horses...`);

        const results = new Map<string, HorseHistoryData | null>();

        const BATCH_SIZE = 3;
        
        for (let i = 0; i < horseNames.length; i += BATCH_SIZE) {
            const batch = horseNames.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(name => 
                this.getHorseHistory(name, region)
                    .then(history => ({ name, history }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(({ name, history }) => {
                results.set(name, history);
            });
            
            if (i + BATCH_SIZE < horseNames.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    private async fetchFromRpscrape(
        horseName: string,
        region: string,
        maxRaces: number
    ): Promise<HorseHistoryData | null> {
        const scriptsDir = path.join(this.RPSCRAPE_DIR, 'scripts');
        
        // Clean horse name for command line (Windows-safe)
        const cleanName = horseName.replace(/"/g, '').replace(/'/g, '');
        
        // FIX: Windows-compatible command using cmd /c
        const command = `cd /d "${scriptsDir}" && python rpscrape.py -r ${region} -h "${cleanName}"`;
        
        console.log(`🐍 Running: ${command}`);

        try {
            const { stdout, stderr } = await execAsync(command, {
                timeout: 60000, // 60 second timeout
                maxBuffer: 1024 * 1024 * 10,
                shell: 'cmd.exe', // Force use of cmd.exe on Windows
            });

            if (stderr && !stderr.includes('Downloading')) {
                console.warn(`⚠️ rpscrape stderr: ${stderr}`);
            }

            // Parse the output
            const outputFile = path.join(this.RPSCRAPE_DIR, 'horses', `${cleanName}.csv`);
            
            // Check if file was created
            try {
                await fs.access(outputFile);
            } catch {
                console.warn(`⚠️ No output file created for ${horseName}`);
                return null;
            }
            
            return await this.parseHorseCSV(outputFile, horseName, maxRaces);

        } catch (error: any) {
            console.error(`❌ rpscrape.py failed for ${horseName}:`, error.message);
            
            // Try to provide helpful error message
            if (error.message.includes('cannot find the path')) {
                console.error(`📁 Check that rpscrape exists at: ${scriptsDir}`);
                console.error(`💡 Try: ls "${scriptsDir}"`);
            }
            
            return null;
        }
    }

    private async parseHorseCSV(
        filePath: string,
        horseName: string,
        maxRaces: number
    ): Promise<HorseHistoryData | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.trim().split('\n');

            if (lines.length < 2) {
                console.warn(`⚠️ No data in ${filePath}`);
                return null;
            }

            const header = lines[0].split(',');
            
            const races: DetailedRaceResult[] = [];
            let wins = 0;
            let places = 0;

            for (let i = 1; i < Math.min(lines.length, maxRaces + 1); i++) {
                const values = lines[i].split(',');
                
                if (values.length < header.length) continue;

                const race = this.parseRaceRow(header, values);
                
                if (race) {
                    races.push(race);
                    
                    if (race.position === 1) wins++;
                    if (race.position <= 3) places++;
                }
            }

            const currentRating = races.length > 0 ? races[0].officialRating : 0;

            console.log(`✅ Parsed ${races.length} races for ${horseName} (${wins} wins)`);

            return {
                horseName,
                races,
                currentRating,
                totalRuns: races.length,
                wins,
                places,
            };

        } catch (error) {
            console.error(`❌ Failed to parse CSV for ${horseName}:`, error);
            return null;
        }
    }

    private parseRaceRow(header: string[], values: string[]): DetailedRaceResult | null {
        try {
            const getVal = (col: string) => {
                const idx = header.indexOf(col);
                return idx >= 0 ? values[idx].trim() : '';
            };

            return {
                date: getVal('date'),
                course: getVal('course'),
                distance: getVal('dist') || getVal('distance'),
                going: getVal('going'),
                raceClass: getVal('class') || getVal('race_class') || 'Unknown',
                raceType: getVal('type') || getVal('race_type') || 'Flat',
                position: parseInt(getVal('pos')) || 99,
                totalRunners: parseInt(getVal('runners')) || 12,
                beatenLengths: parseFloat(getVal('btn')) || 0,
                weight: parseInt(getVal('lbs')) || 0,
                officialRating: parseInt(getVal('or')) || parseInt(getVal('ofr')) || 0,
                jockey: getVal('jockey'),
                trainer: getVal('trainer'),
                sp: getVal('sp'),
                prize: getVal('prize'),
                comment: getVal('comment') || '',
            };
        } catch (error) {
            console.error('❌ Failed to parse race row:', error);
            return null;
        }
    }

    private async getCachedHistory(horseName: string): Promise<HorseHistoryData | null> {
        try {
            const cacheFile = path.join(this.CACHE_DIR, `${this.sanitizeFilename(horseName)}.json`);
            const stat = await fs.stat(cacheFile);
            
            const age = Date.now() - stat.mtimeMs;
            if (age > this.CACHE_TTL) {
                return null;
            }

            const content = await fs.readFile(cacheFile, 'utf-8');
            return JSON.parse(content);

        } catch (error) {
            return null;
        }
    }

    private async cacheHistory(horseName: string, history: HorseHistoryData): Promise<void> {
        try {
            const cacheFile = path.join(this.CACHE_DIR, `${this.sanitizeFilename(horseName)}.json`);
            await fs.writeFile(cacheFile, JSON.stringify(history, null, 2), 'utf-8');
            console.log(`💾 Cached history for ${horseName}`);
        } catch (error) {
            console.warn(`⚠️ Failed to cache history for ${horseName}:`, error);
        }
    }

    private sanitizeFilename(name: string): string {
        return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    }
}

export const rpscrapeFull = new RpscrapeFull();