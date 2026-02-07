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
 * POST /api/analyze-race
 */
router.post('/analyze-race', async (req, res) => {
    try {
        const { course, time, date, region = 'GB' } = req.body;
        
        if (!course || !time || !date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: course, time, date',
            });
        }
        
        console.log(`\n🤖 Analyzing: ${course} ${time} on ${date}`);
        
        const raceDetails = await rpscrapeService.getRaceDetails(course, time, date, region);
        
        if (raceDetails.horses.length === 0) {
            throw new Error('No horses found');
        }
        
        const geminiData = rpscrapeService.transformToGeminiFormat(raceDetails);
        
        // Score calculation - FIXED to match HorseAnalysis type
        const analyzedHorses = geminiData.map((extractedData: any) => {
            const horse = raceDetails.horses.find(h => h.name === extractedData.horse)!;
            
            const scores = {
                speed: normalizeSpeed(extractedData.speed),
                form: normalizeForm(extractedData.form),
                class: 50,
                pace: 50,
                jockey: extractedData.jockey.meetWinPercent,
                trainer: extractedData.trainer.meetWinPercent,
                composite: 0,
            };
            
            scores.composite = 
                (scores.speed * 0.30) +
                (scores.form * 0.30) +
                (scores.class * 0.20) +
                (scores.pace * 0.15) +
                (scores.jockey * 0.05) +
                (scores.trainer * 0.05);
            
            return {
                entry: {
                    horseName: extractedData.horse,
                    postPosition: horse.postPosition,
                    jockey: horse.jockey,
                    trainer: horse.trainer,
                },
                scores,
                data: extractedData,              // ← ADDED: This was missing!
                extractedData: extractedData,     // ← Keep for compatibility
                dataConfidence: 0.85,
            };
        });
        
        const rankedHorses = analyzedHorses.sort((a, b) => b.scores.composite - a.scores.composite);
        
        // Use your existing Gemini service for insights
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
        console.error('❌ Error in /api/analyze-race:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Helper functions
function normalizeSpeed(speedData: any): number {
    if (!speedData?.bestBeyer) return 50;
    return Math.min(100, Math.max(0, (speedData.bestBeyer / 120) * 100));
}

function normalizeForm(formData: any): number {
    if (!formData?.lastThreeRaces || formData.lastThreeRaces.length === 0) return 50;
    
    let points = 0;
    formData.lastThreeRaces.forEach((race: any, index: number) => {
        const recency = 1 - (index * 0.2);
        if (race.position === 1) points += 30 * recency;
        else if (race.position === 2) points += 20 * recency;
        else if (race.position === 3) points += 10 * recency;
        else points += 5 * recency;
    });
    
    return Math.min(100, points);
}

export default router;