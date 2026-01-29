import axios from 'axios';
import * as cheerio from 'cheerio';

interface RaceDataResult {
    success: boolean;
    track: string;
    date: string;
    raceNumber: number;
    horses: Array<{
        name: string;
        postPosition: number;
        jockey?: string;
        trainer?: string;
        morningLineOdds?: string;
    }>;
    html: string;
    source: string;
}

/**
 * Rate limiter to respect website policies
 */
class RateLimiter {
    private lastRequestTime = 0;
    private minDelay = 2000; // 2 seconds between requests
    
    async wait() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minDelay) {
            const waitTime = this.minDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }
}

const rateLimiter = new RateLimiter();

/**
 * Fetches HTML from a URL with proper headers
 */
async function fetchHTML(url: string): Promise<string> {
    await rateLimiter.wait();
    
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000, // 10 second timeout
    });
    
    return response.data;
}

/**
 * Fetches race data from Equibase (US racing)
 */
export async function fetchEquibaseRaceData(
    trackCode: string,
    date: string,
    raceNumber: number
): Promise<RaceDataResult> {
    console.log(`📥 Fetching from Equibase: ${trackCode}, Race ${raceNumber}, ${date}`);
    
    try {
        // Format: https://www.equibase.com/static/entry/CDUSA20240505.html
        const formattedDate = date.replace(/-/g, ''); // 2024-05-05 -> 20240505
        const url = `https://www.equibase.com/static/entry/${trackCode}USA${formattedDate}.html`;
        
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);
        
        const horses: Array<any> = [];
        
        // Parse Equibase format (adjust selectors based on actual HTML)
        $('.entry-row').each((index, element) => {
            const name = $(element).find('.horse-name').text().trim();
            const postPosition = parseInt($(element).find('.post-position').text().trim()) || index + 1;
            const jockey = $(element).find('.jockey-name').text().trim();
            const trainer = $(element).find('.trainer-name').text().trim();
            const odds = $(element).find('.morning-line').text().trim();
            
            if (name) {
                horses.push({
                    name,
                    postPosition,
                    jockey: jockey || undefined,
                    trainer: trainer || undefined,
                    morningLineOdds: odds || undefined,
                });
            }
        });
        
        return {
            success: true,
            track: trackCode,
            date,
            raceNumber,
            horses,
            html,
            source: 'Equibase',
        };
        
    } catch (error) {
        console.error('❌ Equibase fetch failed:', error);
        throw new Error(`Failed to fetch from Equibase: ${error}`);
    }
}

/**
 * Fetches race data from Racing Post (UK/Ireland racing)
 */
export async function fetchRacingPostData(
    trackSlug: string,
    date: string,
    raceTime: string
): Promise<RaceDataResult> {
    console.log(`📥 Fetching from Racing Post: ${trackSlug}, ${date}, ${raceTime}`);
    
    try {
        // Format: https://www.racingpost.com/racecards/[course]/[date]/[time]
        const url = `https://www.racingpost.com/racecards/${trackSlug}/${date}/${raceTime}`;
        
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);
        
        const horses: Array<any> = [];
        
        // Parse Racing Post format
        $('[data-test-selector="RC-cardPage-runnerCard"]').each((index, element) => {
            const name = $(element).find('[data-test-selector="RC-cardPage-runnerName"]').text().trim();
            const postPosition = parseInt($(element).find('.rp-horseTable__draw').text().trim()) || index + 1;
            const jockey = $(element).find('[data-test-selector="RC-cardPage-runnerJockey-name"]').text().trim();
            const trainer = $(element).find('[data-test-selector="RC-cardPage-runnerTrainer-name"]').text().trim();
            const odds = $(element).find('[data-test-selector="RC-cardPage-runnerOdds"]').text().trim();
            
            if (name) {
                horses.push({
                    name,
                    postPosition,
                    jockey: jockey || undefined,
                    trainer: trainer || undefined,
                    morningLineOdds: odds || undefined,
                });
            }
        });
        
        return {
            success: true,
            track: trackSlug,
            date,
            raceNumber: 0, // Racing Post uses time instead
            horses,
            html,
            source: 'Racing Post',
        };
        
    } catch (error) {
        console.error('❌ Racing Post fetch failed:', error);
        throw new Error(`Failed to fetch from Racing Post: ${error}`);
    }
}

/**
 * Universal fetch that tries multiple sources
 */
export async function fetchRaceData(
    track: string,
    date: string,
    raceNumber: number
): Promise<RaceDataResult> {
    
    const errors: string[] = [];
    
    // Try Equibase first (US tracks)
    const trackCode = getEquibaseTrackCode(track);
    if (trackCode) {
        try {
            return await fetchEquibaseRaceData(trackCode, date, raceNumber);
        } catch (error) {
            errors.push(`Equibase: ${error}`);
            console.warn('Equibase failed, trying alternatives...');
        }
    }
    
    // Try Racing Post (UK/international tracks)
    const trackSlug = track.toLowerCase().replace(/\s+/g, '-');
    try {
        return await fetchRacingPostData(trackSlug, date, '1400'); // Default time
    } catch (error) {
        errors.push(`Racing Post: ${error}`);
    }
    
    // If all sources fail, return a mock result for development
    console.warn('⚠️ All data sources failed, returning mock data');
    return {
        success: false,
        track,
        date,
        raceNumber,
        horses: generateMockHorses(),
        html: '<html>Mock data - no real scraping occurred</html>',
        source: 'Mock',
    };
}

/**
 * Convert track name to Equibase track code
 */
function getEquibaseTrackCode(trackName: string): string | null {
    const codes: Record<string, string> = {
        'Churchill Downs': 'CD',
        'Santa Anita': 'SA',
        'Gulfstream Park': 'GP',
        'Keeneland': 'KEE',
        'Saratoga': 'SAR',
        'Del Mar': 'DMR',
        'Belmont Park': 'BEL',
        'Aqueduct': 'AQU',
        'Pimlico': 'PIM',
        'Monmouth Park': 'MTH',
        'Arlington': 'AP',
    };
    
    return codes[trackName] || null;
}

/**
 * Generate mock horses for testing
 */
function generateMockHorses() {
    const names = ['SECRETARIAT', 'SEABISCUIT', 'MAN O WAR', 'AMERICAN PHAROAH', 'JUSTIFY', 'CIGAR'];
    const jockeys = ['J. Smith', 'M. Johnson', 'R. Williams', 'S. Davis'];
    const trainers = ['B. Baffert', 'T. Pletcher', 'C. McGaughey'];
    
    return names.map((name, index) => ({
        name,
        postPosition: index + 1,
        jockey: jockeys[index % jockeys.length],
        trainer: trainers[index % trainers.length],
        morningLineOdds: `${index + 2}/1`,
    }));
}

export default {
    fetchRaceData,
    fetchEquibaseRaceData,
    fetchRacingPostData,
};