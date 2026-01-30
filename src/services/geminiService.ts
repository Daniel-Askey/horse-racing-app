import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedHorseData, HorseAnalysis, Race, RaceCourse } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("Missing API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// System instruction for consistent horse racing analysis
const SYSTEM_INSTRUCTION = `You are an expert horse racing handicapping AI specializing in statistical analysis and predictive modeling.

CORE BEHAVIORS:
1. Always return data in valid JSON format when requested
2. Never hallucinate statistics - if data is unavailable, use null or sensible defaults
3. Prioritize accuracy over completeness
4. Use numerical values (not strings) for all scores and statistics
5. Include source attribution for each data point when possible
6. Clearly indicate confidence levels based on data quality

DATA EXTRACTION RULES:
- Extract exact values from source material
- Do not infer or estimate missing values unless explicitly instructed
- Normalize scores to 0-100 scale when calculating rankings
- Handle missing data gracefully (don't fail entire analysis)
- Cross-reference values across multiple sources when available
- Flag inconsistencies or outliers

OUTPUT REQUIREMENTS:
- Always use ISO 8601 date format (YYYY-MM-DD)
- Round decimal scores to 1 decimal place
- Include metadata: timestamp, sources, data_quality_score when relevant
- Provide actionable insights, not just raw data`;

// ============================================================================
// RATE LIMITING FOR FREE TIER
// ============================================================================

class FreeTierRateLimiter {
    private requestTimes: number[] = [];
    private readonly maxRequestsPerMinute = 15; // Flash limit
    private readonly maxRequestsPerDay = 1000;  // Flash limit
    private dailyCount = 0;
    private lastResetDate = new Date().toDateString();
    
    async checkAndWait(): Promise<void> {
        // Reset daily counter if new day
        const today = new Date().toDateString();
        if (today !== this.lastResetDate) {
            this.dailyCount = 0;
            this.lastResetDate = today;
        }
        
        // Check daily limit
        if (this.dailyCount >= this.maxRequestsPerDay) {
            throw new Error(`Daily API limit reached (${this.maxRequestsPerDay} requests). Resets at midnight.`);
        }
        
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove requests older than 1 minute
        this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
        
        // Check rate limit
        if (this.requestTimes.length >= this.maxRequestsPerMinute) {
            const oldestRequest = this.requestTimes[0];
            const waitTime = 60000 - (now - oldestRequest) + 100; // +100ms buffer
            
            console.log(`Rate limit reached. Waiting ${Math.round(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Recursive call after waiting
            return this.checkAndWait();
        }
        
        // Record this request
        this.requestTimes.push(now);
        this.dailyCount++;
        
        console.log(`API call ${this.dailyCount}/${this.maxRequestsPerDay} today, ${this.requestTimes.length} in last minute`);
    }
}

const rateLimiter = new FreeTierRateLimiter();

// ============================================================================
// OPTIMIZED DATA EXTRACTION (USES FLASH FOR FREE TIER)
// ============================================================================

/**
 * Extracts structured horse racing data from HTML content using Gemini AI
 * OPTIMIZED FOR FREE TIER: Uses Flash model with built-in rate limiting
 */
export async function extractHorseDataFromHtml(html: string, horseName: string): Promise<ExtractedHorseData> {
  // Wait if needed to respect rate limits
  await rateLimiter.checkAndWait();
  
  // Use Flash instead of Pro for free tier (10x more requests)
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Analyze this horse racing HTML data and extract the following information for horse "${horseName}".
    If a piece of information is not present, use null for numbers and empty arrays for lists.
    
    REQUIRED FIELDS:
    1. Best Beyer Speed Figure (number only, or null if not found)
    2. Best speed at today's distance (number only, look for "@ X Distance", or null if not found)
    3. Last 3 Beyer figures as an array of numbers (use empty array if none found)
    4. Last 3 race results with: date (YYYY-MM-DD), position (number), lengths behind (number), track (string), distance (string)
    5. Days since last race (calculate from most recent race date to today: ${new Date().toISOString().split('T')[0]})
    6. Last 3 workout details with: date (YYYY-MM-DD), distance (string), time in seconds (number)
    7. Jockey name (string) and current meet win percentage (number, 0-100)
    8. Trainer name (string) and current meet win percentage (number, 0-100)
    
    IMPORTANT: Return ONLY valid JSON matching the specified schema. No markdown formatting, no explanations.
    
    HTML Data:
    ${html}
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            temperature: 0.2,
            topP: 0.85,
            topK: 40,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    horse: { type: Type.STRING },
                    speed: {
                        type: Type.OBJECT,
                        properties: {
                            bestBeyer: { type: Type.NUMBER },
                            bestAtDistance: { type: Type.NUMBER },
                            lastThreeBeyers: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                        },
                        required: ["bestBeyer", "bestAtDistance", "lastThreeBeyers"]
                    },
                    form: {
                        type: Type.OBJECT,
                        properties: {
                            lastThreeRaces: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        date: { type: Type.STRING },
                                        position: { type: Type.NUMBER },
                                        lengthsBehind: { type: Type.NUMBER },
                                        track: { type: Type.STRING },
                                        distance: { type: Type.STRING }
                                    },
                                    required: ["date", "position", "lengthsBehind"]
                                }
                            },
                            daysSinceLastRace: { type: Type.NUMBER },
                            workouts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        date: { type: Type.STRING },
                                        distance: { type: Type.STRING },
                                        timeSeconds: { type: Type.NUMBER }
                                    },
                                    required: ["date"]
                                }
                            }
                        },
                        required: ["lastThreeRaces", "daysSinceLastRace", "workouts"]
                    },
                    jockey: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            meetWinPercent: { type: Type.NUMBER }
                        },
                        required: ["name", "meetWinPercent"]
                    },
                    trainer: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            meetWinPercent: { type: Type.NUMBER }
                        },
                        required: ["name", "meetWinPercent"]
                    }
                },
                required: ["horse", "speed", "form", "jockey", "trainer"]
            }
        }
    });
    
    if (response.text) {
        const data = JSON.parse(response.text);
        
        if (!data.horse || !data.speed || !data.form || !data.jockey || !data.trainer) {
            throw new Error(`Incomplete data structure returned for ${horseName}`);
        }
        
        return data;
    } else {
        throw new Error("Gemini response was empty.");
    }

  } catch (error) {
    console.error(`Error extracting horse data for ${horseName}:`, error);
    
    if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON response for ${horseName}: ${error.message}`);
    }
    
    throw new Error(`Failed to extract horse data for ${horseName}. Please try again.`);
  }
}

// ============================================================================
// BATCH PROCESSING TO SAVE API CALLS
// ============================================================================

/**
 * Process multiple horses in a single API call (saves quota!)
 * Instead of 12 calls for 12 horses, this uses just 1 call
 */
export async function extractMultipleHorsesData(
    html: string, 
    horseNames: string[]
): Promise<Map<string, ExtractedHorseData>> {
    
    await rateLimiter.checkAndWait();
    
    const model = 'gemini-2.5-flash';
    
    const prompt = `
    Analyze this horse racing HTML data and extract information for ALL of these horses: ${horseNames.join(', ')}
    
    For EACH horse, extract:
    1. Best Beyer Speed Figure (number or null)
    2. Best speed at today's distance (number or null)
    3. Last 3 Beyer figures as array
    4. Last 3 race results (date, position, lengths behind, track, distance)
    5. Days since last race
    6. Last 3 workout details
    7. Jockey name and win percentage
    8. Trainer name and win percentage
    
    Return a JSON object where keys are horse names and values are the extracted data.
    
    HTML Data:
    ${html}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.2,
                topP: 0.85,
                maxOutputTokens: 8192, // Larger for multiple horses
                responseMimeType: "application/json",
            }
        });
        
        if (response.text) {
            const allData = JSON.parse(response.text);
            const resultMap = new Map<string, ExtractedHorseData>();
            
            // Convert object to Map
            for (const [horseName, data] of Object.entries(allData)) {
                resultMap.set(horseName, data as ExtractedHorseData);
            }
            
            console.log(`✅ Extracted data for ${resultMap.size} horses in 1 API call (saved ${horseNames.length - 1} calls)`);
            
            return resultMap;
        }
        
        throw new Error("Empty response from Gemini");
        
    } catch (error) {
        console.error('Batch extraction failed, falling back to individual calls:', error);
        
        // Fallback: extract individually
        const resultMap = new Map<string, ExtractedHorseData>();
        for (const horseName of horseNames) {
            try {
                const data = await extractHorseDataFromHtml(html, horseName);
                resultMap.set(horseName, data);
            } catch (err) {
                console.error(`Failed to extract ${horseName}:`, err);
            }
        }
        return resultMap;
    }
}

// ============================================================================
// RACE INSIGHTS WITH GOOGLE SEARCH (FREE TIER)
// ============================================================================

/**
 * Generates expert race insights using Gemini Flash + Google Search
 */
export async function generateRaceInsights(
    course: RaceCourse, 
    race: Race, 
    topHorses: HorseAnalysis[]
): Promise<string> {
    
    await rateLimiter.checkAndWait();
    
    const model = 'gemini-2.5-flash';
    
    const topThree = topHorses.slice(0, 3).map((h, i) => 
        `${i+1}. ${h.entry.horseName} (#${h.entry.postPosition}) - Composite Score: ${h.scores.composite.toFixed(1)} (Speed: ${Math.round(h.scores.speed)}, Form: ${Math.round(h.scores.form)}, Class: ${Math.round(h.scores.class)})`
    ).join('\n');

    const prompt = `${SYSTEM_INSTRUCTION}

TASK: Provide expert race analysis for Race ${race.raceNumber} at ${course.name}.

RACE DETAILS:
- Track: ${course.name}
- Distance: ${race.distance}
- Surface: ${race.surface}
- Date: ${new Date().toISOString().split('T')[0]}

TOP RANKED HORSES (AI Analysis):
${topThree}

INSTRUCTIONS:
1. Use Google Search to find any relevant late-breaking news, jockey changes, scratches, or track conditions for today's races at ${course.name}
2. Briefly introduce the top contender (#1) and their key strengths (1 paragraph)
3. Mention 1-2 other competitive horses from the list and what makes them dangerous (1 paragraph)
4. Identify a potential value play or dark horse to watch (1 paragraph)
5. Keep the total summary to 2-3 concise paragraphs
6. Use a professional but accessible tone
7. If you find any breaking news (scratches, jockey changes, weather), mention it prominently

OUTPUT FORMAT: Plain text, 2-3 paragraphs, no bullet points or headers.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.4,
                topP: 0.90,
                topK: 40,
                maxOutputTokens: 1024,
                tools: [{googleSearch: {}}],
            }
        });
        
        const text = response.text?.trim();
        
        if (!text) {
            return "Could not generate insights for this race. Please try again.";
        }
        
        return text;
        
    } catch (error) {
        console.error("Error generating race insights with Gemini:", error);
        
        if (error instanceof Error) {
            if (error.message.includes("quota") || error.message.includes("429")) {
                return "⚠️ Daily API limit reached. Your quota resets at midnight PT. Try again tomorrow or upgrade to paid tier for unlimited access.";
            }
            if (error.message.includes("safety")) {
                return "Unable to generate insights due to content safety restrictions.";
            }
        }
        
        return "Insights could not be generated due to an API error. Please try again.";
    }
}

// ============================================================================
// QUOTA MONITORING
// ============================================================================

/**
 * Get current usage statistics
 */
export function getUsageStats() {
    const stats = {
        dailyCount: (rateLimiter as any).dailyCount,
        maxDaily: (rateLimiter as any).maxRequestsPerDay,
        remaining: (rateLimiter as any).maxRequestsPerDay - (rateLimiter as any).dailyCount,
        percentageUsed: ((rateLimiter as any).dailyCount / (rateLimiter as any).maxRequestsPerDay * 100).toFixed(1),
    };
    
    return stats;
}

/**
 * Display usage in console
 */
export function logUsageStats() {
    const stats = getUsageStats();
    console.log(`
    📊 FREE TIER USAGE TODAY:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Used:      ${stats.dailyCount}/${stats.maxDaily} requests
    Remaining: ${stats.remaining} requests
    Progress:  ${stats.percentageUsed}%
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
}