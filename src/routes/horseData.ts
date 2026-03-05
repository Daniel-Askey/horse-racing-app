import express from 'express';
import { extractMultipleHorsesData, generateRaceInsights, getUsageStats } from '../services/geminiService';
import { rpscrapeService } from '../services/rpscrapeService';

const router = express.Router();

/**
 * POST /api/analyze-horses
 * Uses Gemini AI to extract detailed data from HTML
 */
router.post('/analyze-horses', async (req, res) => {
    try {
        const { html, horseNames } = req.body;
        
        if (!html || !horseNames || !Array.isArray(horseNames)) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields: html (string), horseNames (array)' 
            });
        }
        
        console.log(`\n🤖 Analyzing ${horseNames.length} horses with Gemini...`);
        
        const horseDataMap = await extractMultipleHorsesData(html, horseNames);
        
        // Convert Map to object for JSON response
        const horseData: Record<string, any> = {};
        horseDataMap.forEach((data, name) => {
            horseData[name] = data;
        });
        
        console.log(`✅ Analysis complete for ${Object.keys(horseData).length} horses`);
        
        res.json({
            success: true,
            data: horseData,
            usage: getUsageStats(),
        });
        
    } catch (error) {
        console.error('❌ Error in /api/analyze-horses:', error);
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

/**
 * POST /api/generate-insights
 * Generates expert race insights using Gemini + Google Search
 */
router.post('/generate-insights', async (req, res) => {
    try {
        const { course, race, topHorses } = req.body;
        
        if (!course || !race || !topHorses) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields: course, race, topHorses' 
            });
        }
        
        console.log(`\n💡 Generating insights for Race ${race.raceNumber} at ${course.name}...`);
        
        const insights = await generateRaceInsights(course, race, topHorses);
        
        console.log(`✅ Insights generated successfully`);
        
        res.json({
            success: true,
            insights,
            usage: getUsageStats(),
        });
        
    } catch (error) {
        console.error('❌ Error in /api/generate-insights:', error);
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

/**
 * GET /api/usage
 * Returns current API usage statistics
 */
router.get('/usage', (req, res) => {
    res.json({
        success: true,
        usage: getUsageStats(),
    });
});
/**
 * GET /api/test-gemini
 * Tests if Gemini API key is working
 */
router.get('/test-gemini', async (req, res) => {
    try {
        const { GoogleGenAI } = await import('@google/genai');
        
        const apiKey = process.env.API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'API_KEY not found in environment variables',
            });
        }
        
        // Test the API key
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash'; // CHANGED THIS LINE
        
        const response = await ai.models.generateContent({
            model: model,
            contents: 'Say "Hello! API key is working!" in one sentence.',
            config: {
                temperature: 0.5,
                maxOutputTokens: 50,
            }
        });
        
        res.json({
            success: true,
            message: 'Gemini API key is working!',
            testResponse: response.text,
            apiKeyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
        });
        
    } catch (error) {
        console.error('❌ Gemini API test failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            hint: 'Check if your API_KEY in .env is correct',
        });
    }
});

/**
 * GET /api/racecourses?date=2026-02-07&region=GB
 */
router.get('/racecourses', async (req, res) => {
    try {
        const { date, region = 'GB' } = req.query;
        
        if (!date || typeof date !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid date parameter (format: YYYY-MM-DD)',
            });
        }
        
        const courses = await rpscrapeService.getAvailableCourses(date, region as string);
        
        res.json({
            success: true,
            date,
            region,
            courses,
        });
        
    } catch (error) {
        console.error('❌ Error in /api/racecourses:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/races?course=Doncaster&date=2026-02-07&region=GB
 */
router.get('/races', async (req, res) => {
    try {
        const { course, date, region = 'GB' } = req.query;
        
        if (!course || typeof course !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid course parameter',
            });
        }
        
        if (!date || typeof date !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid date parameter (format: YYYY-MM-DD)',
            });
        }
        
        const races = await rpscrapeService.getRaceTimes(course, date, region as string);
        
        res.json({
            success: true,
            course,
            date,
            region,
            races,
        });
        
    } catch (error) {
        console.error('❌ Error in /api/races:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/analyze-race - RACECARD DATA ONLY
 */
router.post('/analyze-race', async (req, res) => {
    try {
        const { course, time, date, region = 'GB' } = req.body;
        
        if (!course || !time || !date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
        }
        
        console.log(`\n🤖 Analyzing: ${course} ${time} on ${date}`);
        
        const raceDetails = await rpscrapeService.getRaceDetails(course, time, date, region);
        
        if (raceDetails.horses.length === 0) {
            throw new Error('No horses found');
        }
        
        console.log(`📊 Scoring ${raceDetails.horses.length} horses using racecard data...`);
        
        const { 
            calculateFormScore, 
            calculateClassScore, 
            calculateSpeedScore,
            calculateDistanceSuitability,  // NEW
            calculatePaceScore,  // NEW
            calculateCompositeScore 
        } = await import('../utils/scoring');
        
        const raceContext = {
            raceName: raceDetails.raceName,
            distance: raceDetails.distance,
        };
        
        const analyzedHorses = raceDetails.horses.map((horse) => {
    const racecardData = {
        form: horse.form,
        lastRun: horse.lastRun,
        rpr: horse.ratings?.rpr || null,
        ts: horse.ratings?.ts || null,
        ofr: horse.ratings?.ofr || null,
        trainerRtf: horse.trainerStats?.rtf || null,
        age: horse.age,
        weight: horse.weight,
    };
    
    // Calculate individual scores
    const speedScore = calculateSpeedScore(racecardData);
    const formScore = calculateFormScore(racecardData);
    const classScore = calculateClassScore(racecardData, raceContext);
    
    // NEW: Add distance suitability
    const distanceSuitability = calculateDistanceSuitability(racecardData, raceContext.distance);
            
            const paceScore = calculatePaceScore(racecardData);  // NEW: Actually calculate it
            const jockeyScore = 50;
            const trainerScore = racecardData.trainerRtf || 50;

            const compositeScore = calculateCompositeScore({
                speed: speedScore,
                form: formScore,
                class: classScore,
                distance: distanceSuitability,  // NEW
                pace: paceScore,
                jockey: jockeyScore,
                trainer: trainerScore,
            });

            // NEW: Calculate data confidence and apply penalty for missing data
            // Calculate data confidence (0-1 scale)
            const hasOR = racecardData.ofr !== null && racecardData.ofr > 0;
            const hasRPR = (racecardData.rpr !== null && racecardData.rpr > 0) || 
                        (racecardData.ts !== null && racecardData.ts > 0);
            const hasForm = racecardData.form && racecardData.form.trim().length > 0;
            const hasLastRun = racecardData.lastRun && racecardData.lastRun.length > 0;

            // Weight different data types
            const dataConfidence = 
                (hasOR ? 0.30 : 0) +       // 30% for Official Rating
                (hasRPR ? 0.30 : 0) +      // 30% for RPR/TS
                (hasForm ? 0.25 : 0) +     // 25% for Form string
                (hasLastRun ? 0.15 : 0);   // 15% for Last run date

            // Log low confidence horses
            if (dataConfidence < 0.6) {
                console.log(`   ⚠️ ${horse.name}: Low data confidence (${(dataConfidence * 100).toFixed(0)}%)`);
            }

            // Apply confidence penalty
            let adjustedComposite = compositeScore;
            if (dataConfidence < 0.6) {
                // Penalize horses with missing data
                const confidencePenalty = 0.85; // 15% reduction
                adjustedComposite = compositeScore * confidencePenalty;
                
                console.log(`   ${horse.name}: Low confidence (${(dataConfidence * 100).toFixed(0)}%) - Applied ${((1 - confidencePenalty) * 100).toFixed(0)}% penalty`);
            }
            
            // Log individual horse scores for debugging
            console.log(`   ${horse.name}: Composite=${compositeScore.toFixed(1)} (Speed=${speedScore.toFixed(1)}, Form=${formScore.toFixed(1)}, Class=${classScore.toFixed(1)}) | Form="${horse.form}" OR=${horse.ratings?.ofr}`);
            
            // Build proper ExtractedHorseData structure
            const extractedData = {
                horse: horse.name,
                speed: {
                    bestBeyer: horse.ratings?.rpr || horse.ratings?.ts || horse.ratings?.ofr || null,
                    bestAtDistance: horse.ratings?.ts || null,
                    lastThreeBeyers: [
                        horse.ratings?.rpr || 0,
                        horse.ratings?.rpr ? horse.ratings.rpr - 5 : 0,  // Estimate
                        horse.ratings?.rpr ? horse.ratings.rpr - 10 : 0   // Estimate
                    ].filter(b => b > 0),
                },
                form: {
                    formString: horse.form,
                    daysSinceLastRace: calculateDaysSince(horse.lastRun),
                    lastThreeRaces: parseFormToRaces(horse.form, horse.lastRun),
                    workouts: [],
                },
                jockey: {
                    name: horse.jockey,
                    meetWinPercent: jockeyScore,
                },
                trainer: {
                    name: horse.trainer,
                    meetWinPercent: trainerScore,
                },
                // NEW: Add individual score components for frontend display
                scores: {
                    speed: speedScore,
                    form: formScore,
                    class: classScore,
                    distance: distanceSuitability,
                    pace: paceScore,
                    jockey: jockeyScore,
                    trainer: trainerScore,
                    composite: adjustedComposite,
                },
                // NEW: Add metadata
                age: horse.age,
                weight: horse.weight,
                lastRun: horse.lastRun,
                officialRating: horse.ratings?.ofr || null,
            };
            
            return {
                entry: {
                    horseName: horse.name,
                    postPosition: horse.postPosition,
                    jockey: horse.jockey,
                    trainer: horse.trainer,
                },
                scores: {
                    speed: speedScore,
                    form: formScore,
                    class: classScore,
                    distance: distanceSuitability,  // NEW
                    pace: paceScore,
                    jockey: jockeyScore,
                    trainer: trainerScore,
                    composite: adjustedComposite,  // Use adjusted score
                },
                data: extractedData,
                extractedData: extractedData,
                dataConfidence: dataConfidence,  // Use calculated confidence
            };
        });
        
        const rankedHorses = analyzedHorses.sort((a, b) => b.scores.composite - a.scores.composite);
        
        console.log(`\n✅ Scoring complete - Top 3:`);
        rankedHorses.slice(0, 3).forEach((h, i) => {
            console.log(`   ${i + 1}. ${h.entry.horseName}: ${h.scores.composite.toFixed(1)} (Speed: ${h.scores.speed.toFixed(1)}, Form: ${h.scores.form.toFixed(1)}, Class: ${h.scores.class.toFixed(1)})`);
        });
        
        const { generateRaceInsights } = await import('../services/geminiService');
        
        const insights = await generateRaceInsights(
            { name: course },
            { raceNumber: 1, distance: raceDetails.distance, surface: 'Turf' },
            rankedHorses.slice(0, 3)
        );
        
        res.json({
            success: true,
            race: {
                course: raceDetails.courseName,
                time: raceDetails.time,
                name: raceDetails.raceName,
                distance: raceDetails.distance,
                prize: raceDetails.prize,
            },
            rankedHorses,
            insights,
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

function calculateDaysSince(lastRun: string): number {
    if (!lastRun) return 999;
    try {
        const lastRunDate = new Date(lastRun);
        const today = new Date();
        const diffTime = today.getTime() - lastRunDate.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return 999;
    }
}

/**
 * Parse form string to race history array
 */
function parseFormToRaces(form: string, lastRun: string): any[] {
    if (!form) return [];
    
    // Clean and split form
    const cleaned = form.trim().replace(/^-+|-+$/g, '');
    const positions = cleaned.split('-')
        .filter(p => p.trim().length > 0)
        .map(p => {
            const match = p.match(/(\d+)/);
            return match ? parseInt(match[1]) : 99;
        })
        .filter(p => p < 99)
        .slice(0, 3);
    
    // Estimate dates (assuming races every 21 days)
    const lastRunDate = lastRun ? new Date(lastRun) : new Date();
    
    return positions.map((position, index) => {
        const raceDate = new Date(lastRunDate);
        raceDate.setDate(raceDate.getDate() - (index * 21));
        
        return {
            date: raceDate.toISOString().split('T')[0],
            position: position,
            lengthsBehind: position === 1 ? 0 : (position - 1) * 2.5,
            track: 'Unknown',
            distance: 'Unknown',
        };
    });
}

export default router;