import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function fetchRaceCards(day: 1 | 2 = 1, region = 'GB'): Promise<any> {
    const scriptsPath = path.join(__dirname, '../../rpscrape/scripts');
    const dateStr = new Date().toISOString().split('T')[0];

    // Run racecards.py
    await execAsync(`py racecards.py --day ${day} --region ${region}`, { cwd: scriptsPath });

    // Read JSON output
    const jsonFile = path.join(__dirname, '../../rpscrape/racecards', `${dateStr}.json`);
    const jsonData = await fs.readFile(jsonFile, 'utf-8');
    return JSON.parse(jsonData);
}

export function getRaceByTrackAndTime(data: any, track: string, raceTime: string) {
    const trackName = track.charAt(0).toUpperCase() + track.slice(1);
    const races = data.GB?.[trackName] || {};

    const race = races[raceTime];
    if (!race) throw new Error(`Race not found: ${trackName} at ${raceTime}`);

    return race.runners.map((runner: any, index: number) => ({
        name: runner.name,
        postPosition: runner.number || index + 1,
        jockey: runner.jockey,
        trainer: runner.trainer,
        morningLineOdds: runner.odds || 'N/A',
    }));
}
