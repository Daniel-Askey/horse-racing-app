import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { Race, RaceCourse, HorseEntry, AnalysisProgressState, AnalysisStatus, AnalysisResults, HorseAnalysis } from '../types';

// Import backend service (you'll create this file next)
import { 
    fetchRaceDataFromBackend, 
    analyzeHorsesViaBackend, 
    generateInsightsViaBackend,
    checkBackendHealth 
} from '../services/backendService';

const initialState: AnalysisProgressState = {
    stage: 'idle',
    percent: 0,
    details: ''
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Calculate scores from extracted horse data
 */
function calculateHorseScores(data: any) {
    // Speed Score (0-100)
    const speedScore = normalizeSpeed(data.speed);
    
    // Form Score (0-100)
    const formScore = normalizeForm(data.form);
    
    // Jockey Score (0-100)
    const jockeyScore = data.jockey?.meetWinPercent || 50;
    
    // Trainer Score (0-100)
    const trainerScore = data.trainer?.meetWinPercent || 50;
    
    // Placeholders for other factors
    const classScore = 50; // Will be enhanced later
    const paceScore = 50;  // Will be enhanced later
    
    // Composite Score (weighted average)
    const composite = 
        (speedScore * 0.30) +
        (formScore * 0.30) +
        (classScore * 0.20) +
        (paceScore * 0.15) +
        (jockeyScore * 0.05) +
        (trainerScore * 0.05);
    
    return {
        speed: speedScore,
        form: formScore,
        class: classScore,
        pace: paceScore,
        jockey: jockeyScore,
        trainer: trainerScore,
        composite: Math.round(composite * 10) / 10, // Round to 1 decimal
    };
}

/**
 * Normalize speed figures to 0-100 scale
 */
function normalizeSpeed(speedData: any): number {
    if (!speedData?.bestBeyer) return 50;
    
    const bestBeyer = speedData.bestBeyer;
    const lastThree = speedData.lastThreeBeyers || [];
    
    // Calculate average of last 3 races
    const avgRecent = lastThree.length > 0
        ? lastThree.reduce((sum: number, val: number) => sum + val, 0) / lastThree.length
        : bestBeyer;
    
    // Weight recent performance higher (60% recent, 40% best)
    const weighted = (avgRecent * 0.6) + (bestBeyer * 0.4);
    
    // Normalize to 0-100 (assuming Beyer range 20-120)
    // 120+ = 100, 70 = 50, 20 = 0
    return Math.min(100, Math.max(0, ((weighted - 20) / 100) * 100));
}

/**
 * Normalize recent form to 0-100 scale
 */
function normalizeForm(formData: any): number {
    if (!formData?.lastThreeRaces || formData.lastThreeRaces.length === 0) {
        return 50; // No data = average score
    }
    
    let points = 0;
    const races = formData.lastThreeRaces.slice(0, 3); // Only last 3
    
    races.forEach((race: any, index: number) => {
        // More recent races weighted higher
        const recencyWeight = 1 - (index * 0.2); // 1.0, 0.8, 0.6
        
        // Points based on position
        if (race.position === 1) points += 35 * recencyWeight;
        else if (race.position === 2) points += 25 * recencyWeight;
        else if (race.position === 3) points += 15 * recencyWeight;
        else if (race.position <= 5) points += 8 * recencyWeight;
        else points += 3 * recencyWeight;
    });
    
    // Penalty for long layoff (>60 days)
    if (formData.daysSinceLastRace > 60) {
        points -= 15;
    } else if (formData.daysSinceLastRace > 30) {
        points -= 8;
    }
    
    // Normalize to 0-100
    return Math.min(100, Math.max(0, points));
}

export const useRaceAnalysis = () => {
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [progress, setProgress] = useState<AnalysisProgressState>(initialState);
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeRace = useCallback(async (course: RaceCourse, race: Race) => {
        setStatus('loading');
        setError(null);
        setResults(null);
        
        try {
            // Step 1: Check backend connection
            setProgress({ stage: 'Connecting to backend', percent: 5, details: 'Checking server...' });
            await delay(300);
            
            const backendRunning = await checkBackendHealth();
            if (!backendRunning) {
                throw new Error('❌ Backend server is not running!\n\nPlease start it in VS Code:\n1. Open terminal\n2. Run: npm run dev\n3. Try again');
            }
            
            // Step 2: Fetch race data (web scraping via backend)
            setProgress({ stage: 'Fetching race data', percent: 15, details: `Searching for Race ${race.raceNumber} at ${course.name}...` });
            await delay(500);
            
            const today = format(new Date(), 'yyyy-MM-dd');
            const raceDataResult = await fetchRaceDataFromBackend(
                course.name,
                today,
                race.raceNumber
            );
            
            if (!raceDataResult.success || !raceDataResult.data) {
                throw new Error('Failed to fetch race data from backend');
            }
            
            const { horses, html, source } = raceDataResult.data;
            
            if (horses.length === 0) {
                throw new Error(`No horses found for Race ${race.raceNumber}. The race may not be available yet.`);
            }
            
            setProgress({ 
                stage: 'Data collected', 
                percent: 30, 
                details: `Found ${horses.length} horses from ${source}` 
            });
            await delay(500);
            
            // Step 3: Analyze horses with Gemini AI (via backend)
            setProgress({ 
                stage: 'Analyzing with AI', 
                percent: 40, 
                details: `Processing ${horses.length} horses with Gemini...` 
            });
            
            const horseNames = horses.map((h: any) => h.name);
            const analysisResult = await analyzeHorsesViaBackend(html, horseNames);
            
            if (!analysisResult.success || !analysisResult.data) {
                throw new Error('AI analysis failed');
            }
            
            setProgress({ 
                stage: 'Calculating scores', 
                percent: 60, 
                details: 'Ranking horses by composite scores...' 
            });
            await delay(500);
            
            // Step 4: Calculate scores and create HorseAnalysis objects
            const analyzedHorses: HorseAnalysis[] = [];
            
            for (const horseName of horseNames) {
                const extractedData = analysisResult.data[horseName];
                if (!extractedData) {
                    console.warn(`No data for ${horseName}, skipping...`);
                    continue;
                }
                
                const horseEntry = horses.find((h: any) => h.name === horseName);
                const scores = calculateHorseScores(extractedData);
                
                analyzedHorses.push({
                    entry: {
                        horseName: horseName,
                        postPosition: horseEntry?.postPosition || 0,
                        jockey: extractedData.jockey?.name || 'Unknown',
                        trainer: extractedData.trainer?.name || 'Unknown',
                        weight: horseEntry?.weight ?? 0,
                        morningLineOdds: horseEntry?.morningLineOdds ?? 'N/A',
                    },
                    extractedData,
                    scores,
                    dataConfidence: 0.85, // Adjust based on data completeness
                });
            }
            
            // Step 5: Rank horses by composite score
            const rankedHorses = analyzedHorses.sort(
                (a, b) => b.scores.composite - a.scores.composite
            );
            
            setProgress({ 
                stage: 'Generating insights', 
                percent: 85, 
                details: 'Getting expert analysis with Google Search...' 
            });
            await delay(500);
            
            // Step 6: Generate insights with Google Search
            const insightsResult = await generateInsightsViaBackend(
                course,
                race,
                rankedHorses.slice(0, 3) // Top 3 horses
            );
            
            const insights = insightsResult.success 
                ? insightsResult.insights 
                : 'Insights unavailable at this time.';
            
            // Step 7: Prepare final results
            const finalResults: AnalysisResults = {
                course,
                race,
                rankedHorses,
                insights,
                analysisTimestamp: format(new Date(), 'PPpp'),
            };
            
            setResults(finalResults);
            setStatus('success');
            setProgress({ stage: 'Complete', percent: 100, details: '✅ Analysis complete!' });
            
            // Log usage stats if available
            if (analysisResult.usage) {
                console.log('📊 API Usage:', analysisResult.usage);
            }
            
        } catch (err) {
            console.error("❌ Analysis failed:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(message);
            setStatus('error');
            setProgress(initialState);
        }
    }, []);
    
    return { status, progress, results, error, analyzeRace };
};