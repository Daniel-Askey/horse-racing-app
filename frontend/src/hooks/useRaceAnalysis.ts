import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { Race, RaceCourse, AnalysisProgressState, AnalysisStatus, AnalysisResults } from '../types';

const initialState: AnalysisProgressState = {
    stage: 'idle',
    percent: 0,
    details: ''
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const useRaceAnalysis = () => {
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [progress, setProgress] = useState<AnalysisProgressState>(initialState);
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeRace = useCallback(async (course: RaceCourse, race: Race) => {
        setStatus('loading');
        setError(null);
        setResults(null);
        
        // Use valid stage type
        setProgress({ 
            stage: 'Connecting to backend', 
            percent: 10, 
            details: `Race ${race.raceNumber}` 
        });
        
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            
            await delay(300);
            
            // Call the new unified analyze-race endpoint
            setProgress({ 
                stage: 'Fetching race data', 
                percent: 20, 
                details: `${course.name} ${race.time}` 
            });
            
            const response = await fetch('http://localhost:3001/api/analyze-race', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course: course.name,
                    time: race.time,
                    date: today,
                    region: 'GB',
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
            
            setProgress({ 
                stage: 'Analyzing with AI', 
                percent: 50, 
                details: 'Processing horse data...' 
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }
            
            await delay(500);
            
            setProgress({ 
                stage: 'Calculating scores', 
                percent: 90, 
                details: 'Generating insights...' 
            });
            
            await delay(300);
            
            const finalResults: AnalysisResults = {
                course: {
                    name: data.race.course,
                    code: course.code,           // Use original course code
                    location: course.location,   // Use original course location
                },
                race: {
                    id: race.id || data.race.time,           // Use original race ID or time as fallback
                    raceNumber: race.raceNumber,
                    time: data.race.time,
                    distance: data.race.distance,
                    surface: 'Turf',
                    raceType: data.race.name || 'Unknown',   // Add race type from backend
                    horseCount: data.rankedHorses.length,    // Add horse count from results
                },
                rankedHorses: data.rankedHorses,
                insights: data.insights,
                analysisTimestamp: format(new Date(), 'PPpp'),
            };
            
            setResults(finalResults);
            setStatus('success');
            setProgress({ 
                stage: 'Complete', 
                percent: 100, 
                details: '✅ Analysis complete!' 
            });

        } catch (err) {
            console.error("Analysis failed:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${message}`);
            setStatus('error');
            setProgress(initialState);
        }
    }, []);
    
    return { status, progress, results, error, analyzeRace };
};