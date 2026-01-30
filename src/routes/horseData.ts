import express from 'express';
import { fetchRaceData } from '../services/webScrapingService';
import { extractMultipleHorsesData, generateRaceInsights, getUsageStats } from '../services/geminiService';

const router = express.Router();

/**
 * GET /api/race-data
 * Fetches race entries and HTML from racing websites
 */
router.get('/race-data', async (req, res) => {
    try {
        const { track, date, raceNumber } = req.query;
        
        if (!track || !date || !raceNumber) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required parameters: track, date, raceNumber' 
            });
        }
        
        console.log(`\n📋 Request: ${track}, Race ${raceNumber}, ${date}`);
        
        const raceData = await fetchRaceData(
            track as string,
            date as string,
            parseInt(raceNumber as string)
        );
        
        console.log(`✅ Found ${raceData.horses.length} horses from ${raceData.source}`);
        
        res.json({
            success: true,
            data: raceData,
        });
        
    } catch (error) {
        console.error('❌ Error in /api/race-data:', error);
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

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

export default router;