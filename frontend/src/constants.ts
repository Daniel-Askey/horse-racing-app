
import type { RaceCourse, Race, HorseEntry } from './types';

export const RACE_COURSES: RaceCourse[] = [
  { id: 'CD', name: 'Churchill Downs', country: 'USA' },
  { id: 'SA', name: 'Santa Anita Park', country: 'USA' },
  { id: 'BEL', name: 'Belmont Park', country: 'USA' },
  { id: 'ASC', name: 'Ascot', country: 'UK' },
  { id: 'CUR', name: 'Curragh', country: 'IRE' },
  { id: 'DUB', name: 'Meydan Racecourse', country: 'UAE' },
];

export const RACES_BY_COURSE: Record<string, Race[]> = {
  'CD': [
    { id: 'CD1', raceNumber: 1, time: '1:00 PM', distance: '6 Furlongs', surface: 'Dirt', raceType: 'Maiden Special Weight', horseCount: 8 },
    { id: 'CD7', raceNumber: 7, time: '4:30 PM', distance: '1 1/8 Miles', surface: 'Turf', raceType: 'Allowance Optional Claiming', horseCount: 10 },
    { id: 'CD9', raceNumber: 9, time: '5:45 PM', distance: '1 Mile', surface: 'Dirt', raceType: 'Stakes', horseCount: 7 },
  ],
  'SA': [
    { id: 'SA3', raceNumber: 3, time: '2:15 PM', distance: '5 1/2 Furlongs', surface: 'Turf', raceType: 'Claiming', horseCount: 12 },
    { id: 'SA8', raceNumber: 8, time: '5:00 PM', distance: '1 1/4 Miles', surface: 'Dirt', raceType: 'Grade 1 Stakes', horseCount: 6 },
  ],
  'ASC': [
      { id: 'ASC2', raceNumber: 2, time: '2:30 PM', distance: '1 Mile', surface: 'Turf', raceType: 'Group 2', horseCount: 14 },
      { id: 'ASC4', raceNumber: 4, time: '3:40 PM', distance: '5 Furlongs', surface: 'Turf', raceType: 'Group 1', horseCount: 18 },
  ]
  // Add more races for other courses
};

export const HORSE_ENTRIES_BY_RACE: Record<string, HorseEntry[]> = {
    'CD9': [
        { postPosition: 1, horseName: 'Galactic Sprint', jockey: 'J. Rosario', trainer: 'S. Asmussen', weight: 122, morningLineOdds: '5-2' },
        { postPosition: 2, horseName: 'Dust Devil', jockey: 'I. Ortiz Jr.', trainer: 'T. Pletcher', weight: 120, morningLineOdds: '3-1' },
        { postPosition: 3, horseName: 'Ironclad', jockey: 'F. Prat', trainer: 'B. Baffert', weight: 124, morningLineOdds: '9-2' },
        { postPosition: 4, horseName: 'Midnight Train', jockey: 'L. Saez', trainer: 'B. Cox', weight: 120, morningLineOdds: '6-1' },
        { postPosition: 5, horseName: 'Secretariat', jockey: 'R. Turcotte', trainer: 'L. Laurin', weight: 126, morningLineOdds: '1-5' },
        { postPosition: 6, horseName: 'Seabiscuit', jockey: 'R. Pollard', trainer: 'T. Smith', weight: 115, morningLineOdds: '10-1' },
        { postPosition: 7, horseName: "Man o' War", jockey: 'C. Kummer', trainer: 'L. Feustel', weight: 126, morningLineOdds: '2-1' },
    ]
    // Add more entries for other races
};

// This simulates the raw HTML content that would be scraped from a racing form website.
export const MOCK_HORSE_HTML_DATA: Record<string, string> = {
    'Secretariat': `
        <div class="horse-profile">
            <h2>Secretariat</h2>
            <div class="stats speed-figures">
                <h3>Speed Figures</h3>
                <p>Beyer: Lifetime Best 121</p>
                <p>Best @ 1 Mile: 115</p>
                <p>Recent Beyers: 121, 118, 119</p>
            </div>
            <div class="stats form-data">
                <h3>Recent Form</h3>
                <ul>
                    <li>09-Jun-1973, BEL, 1st, 31 lengths, 1 1/2 Miles</li>
                    <li>19-May-1973, PIM, 1st, 2.5 lengths, 1 3/16 Miles</li>
                    <li>05-May-1973, CD, 1st, 2.5 lengths, 1 1/4 Miles</li>
                </ul>
                <p>Days Since Last Race: 15</p>
                 <h3>Workouts</h3>
                <ul>
                    <li>01-Jun-1973, 5F, 59.0s</li>
                    <li>25-May-1973, 4F, 47.2s</li>
                </ul>
            </div>
            <div class="stats connections">
                <h3>Connections</h3>
                <p>Jockey: Ron Turcotte, Meet Win %: 35%</p>
                <p>Trainer: Lucien Laurin, Meet Win %: 28%</p>
            </div>
        </div>
    `,
    'Seabiscuit': `
        <div class="horse-profile">
            <h2>Seabiscuit</h2>
            <div class="stats speed-figures">
                <h3>Speed Figures</h3>
                <p>Beyer: Lifetime Best 114</p>
                <p>Best @ 1 Mile: 110</p>
                <p>Recent Beyers: 114, 109, 111</p>
            </div>
            <div class="stats form-data">
                <h3>Recent Form</h3>
                <ul>
                    <li>01-Nov-1938, PIM, 1st, 4 lengths, 1 3/16 Miles</li>
                    <li>... more races ...</li>
                </ul>
                <p>Days Since Last Race: 28</p>
                <h3>Workouts</h3>
                <ul>
                    <li>25-Oct-1938, 6F, 72.4s</li>
                </ul>
            </div>
            <div class="stats connections">
                <h3>Connections</h3>
                <p>Jockey: Red Pollard, Meet Win %: 22%</p>
                <p>Trainer: Tom Smith, Meet Win %: 19%</p>
            </div>
        </div>
    `,
    "Man o' War": `
        <div class="horse-profile">
            <h2>Man o' War</h2>
            <div class="stats speed-figures">
                <h3>Speed Figures</h3>
                <p>Beyer: Lifetime Best 120</p>
                <p>Best @ 1 Mile: 118</p>
                <p>Recent Beyers: 120, 117, 116</p>
            </div>
            <div class="stats form-data">
                <h3>Recent Form</h3>
                <ul>
                    <li>12-Oct-1920, KEN, 1st, 7 lengths, 1 5/8 Miles</li>
                </ul>
                <p>Days Since Last Race: 45</p>
                <h3>Workouts</h3>
                <ul>
                    <li>05-Oct-1920, 1M, 97.0s</li>
                </ul>
            </div>
            <div class="stats connections">
                <h3>Connections</h3>
                <p>Jockey: Clarence Kummer, Meet Win %: 25%</p>
                <p>Trainer: Louis Feustel, Meet Win %: 31%</p>
            </div>
        </div>
    `
};

// Add default mock data for other horses to prevent errors
const otherHorses = ['Galactic Sprint', 'Dust Devil', 'Ironclad', 'Midnight Train'];
otherHorses.forEach(horse => {
    MOCK_HORSE_HTML_DATA[horse] = `
        <div class="horse-profile">
            <h2>${horse}</h2>
            <div class="stats speed-figures">
                <p>Beyer: Lifetime Best 105</p>
                <p>Best @ 1 Mile: 102</p>
                <p>Recent Beyers: 105, 101, 98</p>
            </div>
            <div class="stats form-data">
                <h3>Recent Form</h3>
                <ul>
                    <li>15-Jul-2024, SAR, 2nd, 1 length, 7 Furlongs</li>
                </ul>
                <p>Days Since Last Race: 30</p>
                <h3>Workouts</h3>
                <ul>
                    <li>01-Aug-2024, 4F, 48.0s</li>
                </ul>
            </div>
            <div class="stats connections">
                <p>Jockey: Some Jockey, Meet Win %: 18%</p>
                <p>Trainer: Some Trainer, Meet Win %: 15%</p>
            </div>
        </div>
    `;
});
