const API_BASE_URL = 'http://localhost:3001/api';

export interface RaceCourse {
    name: string;
}

export interface RaceTime {
    time: string;
    raceName: string;
    raceNumber: number;
}

export interface RaceAnalysis {
    success: boolean;
    race: {
        course: string;
        time: string;
        name: string;
        distance: string;
        prize: string;
    };
    rankedHorses: any[];
    insights: string;
}

/**
 * Get available racecourses for a date
 */
export async function fetchRacecourses(date: string, region: string = 'GB'): Promise<string[]> {
    const response = await fetch(
        `${API_BASE_URL}/racecourses?date=${date}&region=${region}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to fetch racecourses: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to load racecourses');
    }
    
    return data.courses;
}

/**
 * Get race times for a specific course
 */
export async function fetchRaceTimes(
    course: string,
    date: string,
    region: string = 'GB'
): Promise<RaceTime[]> {
    const response = await fetch(
        `${API_BASE_URL}/races?course=${encodeURIComponent(course)}&date=${date}&region=${region}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to fetch race times: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to load race times');
    }
    
    return data.races;
}

/**
 * Analyze a race with AI
 */
export async function analyzeRace(
    course: string,
    time: string,
    date: string,
    region: string = 'GB'
): Promise<RaceAnalysis> {
    const response = await fetch(`${API_BASE_URL}/analyze-race`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course, time, date, region }),
    });
    
    if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
    }
    
    return data;
}