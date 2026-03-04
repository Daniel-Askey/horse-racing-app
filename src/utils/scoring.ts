/**
 * Horse Racing Scoring - Using Racecard Data Only
 * Enhanced algorithms to make the most of available data
 */

interface HorseRacecardData {
    form: string;              // e.g., "1-2-3-4P"
    lastRun: string;           // e.g., "2024-01-15"
    rpr: number | null;        // Racing Post Rating
    ts: number | null;         // Top Speed
    ofr: number | null;        // Official Rating
    trainerRtf: number | null; // Trainer recent form %
    age: number;
    weight: number;
}

interface RaceContext {
    raceName: string;
    distance: string;
}

/**
 * Calculate FORM score from form string
 * Heavily rewards recent wins and consistency
 */
export function calculateFormScore(horse: HorseRacecardData): number {
    const { form, lastRun } = horse;
    
    if (!form || form.trim().length === 0) {
        return 30;
    }
    
    const formPositions = parseFormString(form);
    
    if (formPositions.length === 0) {
        return 30;
    }
    
    // Recency weights - last run matters most
    const recencyWeights = [1.0, 0.85, 0.7, 0.55, 0.4];
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // Score each run
    formPositions.slice(0, 5).forEach((position, index) => {
        let finishScore = getBaseFinishScore(position);
        
        // Consistency bonus (avoid non-finishers)
        if (position < 10 && position > 0) {
            finishScore *= 1.1; // 10% bonus for completing
        }
        
        const recencyWeight = recencyWeights[index] || 0.3;
        const weightedScore = finishScore * recencyWeight;
        
        totalWeightedScore += weightedScore;
        totalWeight += recencyWeight;
    });
    
    const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 30;
    
    // Freshness adjustment
    const daysSince = calculateDaysSince(lastRun);
    const freshnessMultiplier = getFreshnessAdjustment(daysSince);
    
    const finalScore = averageScore * freshnessMultiplier;
    
    return Math.max(0, Math.min(100, finalScore));
}

/**
 * Calculate CLASS score using ratings and race name
 */
export function calculateClassScore(
    horse: HorseRacecardData,
    raceContext: RaceContext
): number {
    const { ofr, rpr, ts } = horse;
    
    // 1. Official Rating is the best class indicator (70% weight)
    const normalizedOR = ofr ? normalizeOfficialRating(ofr) : 50;
    
    // 2. RPR/TS shows proven ability (20% weight)
    const bestRating = rpr || ts || ofr || 0;
    const ratingScore = bestRating > 0 
        ? Math.min(100, ((bestRating - 60) / 100) * 100) 
        : 50;
    
    // 3. Race quality estimation (10% weight)
    const raceClassScore = estimateRaceClass(raceContext.raceName);
    
    const classScore = 
        (normalizedOR * 0.70) +
        (ratingScore * 0.20) +
        (raceClassScore * 0.10);
    
    return Math.max(0, Math.min(100, classScore));
}

/**
 * Calculate SPEED score from ratings
 */
export function calculateSpeedScore(horse: HorseRacecardData): number {
    const { rpr, ts, ofr } = horse;
    
    // Use best available figure
    const primaryFigure = rpr || ts || ofr || 0;
    
    if (primaryFigure === 0) {
        return 50;
    }
    
    // RPR/TS typically range 60-160
    // 60 = 0 points, 160 = 100 points
    const normalized = ((primaryFigure - 60) / 100) * 100;
    
    return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate composite score
 */
export function calculateCompositeScore(scores: {
    speed: number;
    form: number;
    class: number;
    pace?: number;
    jockey?: number;
    trainer?: number;
}): number {
    const {
        speed = 50,
        form = 50,
        class: classScore = 50,
        pace = 50,
        jockey = 50,
        trainer = 50,
    } = scores;
    
    const composite = 
        (speed * 0.30) +
        (form * 0.30) +
        (classScore * 0.20) +
        (pace * 0.15) +
        (jockey * 0.03) +
        (trainer * 0.02);
    
    return Math.max(0, Math.min(100, composite));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseFormString(form: string): number[] {
    if (!form) return [];
    
    const positions: number[] = [];
    const parts = form.split('-');
    
    for (const part of parts) {
        const match = part.match(/(\d+)/);
        if (match) {
            const position = parseInt(match[1]);
            if (position > 0 && position < 99) {
                positions.push(position);
            }
        } else if (part.includes('P') || part.includes('F') || part.includes('U')) {
            positions.push(99); // Non-finisher
        }
    }
    
    return positions;
}

function getBaseFinishScore(position: number): number {
    if (!position || position < 1) return 10;
    if (position >= 99) return 5; // Non-finisher
    
    // Enhanced scoring that rewards winners heavily
    switch (position) {
        case 1: return 100;  // Winner gets full points
        case 2: return 85;   // Second gets 85%
        case 3: return 70;   // Third gets 70%
        case 4: return 58;
        case 5: return 48;
        case 6: return 40;
        case 7: return 33;
        case 8: return 27;
        case 9: return 22;
        case 10: return 18;
        default: return Math.max(5, 40 - (position * 2.5));
    }
}

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

function getFreshnessAdjustment(days: number): number {
    // Optimal freshness curve
    if (days <= 7) return 1.05;    // Very fresh - slight bonus
    if (days <= 14) return 1.0;    // Ideal
    if (days <= 21) return 0.98;   // Good
    if (days <= 28) return 0.95;   // Acceptable
    if (days <= 42) return 0.88;   // Getting rusty
    if (days <= 56) return 0.80;   // Rusty
    if (days <= 84) return 0.70;   // Long layoff
    if (days <= 180) return 0.55;  // Extended break
    return 0.40;                    // Very long layoff
}

function normalizeOfficialRating(rating: number): number {
    if (!rating || rating < 0) return 50;
    
    // OR typically ranges 60-180
    const MIN_OR = 60;
    const MAX_OR = 180;
    
    const clamped = Math.max(MIN_OR, Math.min(MAX_OR, rating));
    return ((clamped - MIN_OR) / (MAX_OR - MIN_OR)) * 100;
}

function estimateRaceClass(raceName: string): number {
    if (!raceName) return 50;
    
    const nameUpper = raceName.toUpperCase();
    
    // Group/Grade races
    if (nameUpper.includes('GRADE 1') || nameUpper.includes('GROUP 1')) return 100;
    if (nameUpper.includes('GRADE 2') || nameUpper.includes('GROUP 2')) return 90;
    if (nameUpper.includes('GRADE 3') || nameUpper.includes('GROUP 3')) return 80;
    
    if (nameUpper.includes('LISTED')) return 75;
    if (nameUpper.includes('STAKES')) return 70;
    
    // Pattern matching for class indicators
    if (nameUpper.includes('HANDICAP')) return 60;
    if (nameUpper.includes('NOVICE')) return 55;
    if (nameUpper.includes('MAIDEN')) return 45;
    if (nameUpper.includes('CLAIMING')) return 40;
    if (nameUpper.includes('SELLING')) return 35;
    
    // Default
    return 50;
}