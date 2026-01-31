/**
 * Backend Service - Connects Frontend to Local Backend
 * No tunnels needed - both run on localhost!
 */

const BACKEND_URL = 'http://localhost:3001/api';

export interface BackendRaceData {
    success: boolean;
    data: {
        track: string;
        date: string;
        raceNumber: number;
        horses: Array<{
            name: string;
            postPosition: number;
            jockey?: string;
            trainer?: string;
            weight?: number;
            morningLineOdds?: string;
        }>;
        html: string;
        source: string;
    };
}

export interface BackendHorseAnalysis {
    success: boolean;
    data: Record<string, any>;
    usage?: {
        dailyCount: number;
        maxDaily: number;
        remaining: number;
        percentageUsed: string;
    };
}

export interface BackendInsights {
    success: boolean;
    insights: string;
    usage?: any;
}

/**
 * Fetch race data from backend
 */
export async function fetchRaceDataFromBackend(
    track: string,
    date: string,
    raceNumber: number
): Promise<BackendRaceData> {
    console.log(`📥 Fetching race data from backend...`);
    
    const response = await fetch(
        `${BACKEND_URL}/race-data?track=${encodeURIComponent(track)}&date=${date}&raceNumber=${raceNumber}`
    );
    
    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Received ${result.data?.horses?.length || 0} horses`);
    
    return result;
}

/**
 * Analyze horses using backend + Gemini
 */
export async function analyzeHorsesViaBackend(
    html: string,
    horseNames: string[]
): Promise<BackendHorseAnalysis> {
    console.log(`🤖 Analyzing ${horseNames.length} horses with Gemini...`);
    
    const response = await fetch(`${BACKEND_URL}/analyze-horses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, horseNames }),
    });
    
    if (!response.ok) {
        throw new Error(`Backend analysis failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Analysis complete`);
    
    return result;
}

/**
 * Generate race insights using backend + Gemini + Google Search
 */
export async function generateInsightsViaBackend(
    course: any,
    race: any,
    topHorses: any[]
): Promise<BackendInsights> {
    console.log(`💡 Generating insights...`);
    
    const response = await fetch(`${BACKEND_URL}/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, race, topHorses }),
    });
    
    if (!response.ok) {
        throw new Error(`Insights generation failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Insights generated`);
    
    return result;
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        console.log('🔍 Checking backend health...');
        
        const response = await fetch('http://localhost:3001/health', {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        
        const data = await response.json();
        const isHealthy = data.status === 'Backend server is running!';
        
        console.log(`Backend: ${isHealthy ? '✅ Online' : '❌ Offline'}`);
        
        return isHealthy;
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        return false;
    }
}

/**
 * Get current API usage stats
 */
export async function getBackendUsageStats() {
    try {
        const response = await fetch(`${BACKEND_URL}/usage`);
        return await response.json();
    } catch (error) {
        console.error('Failed to get usage stats:', error);
        return null;
    }
}