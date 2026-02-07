import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import type { Race, RaceCourse } from '../types';
import { CalendarIcon, MapPinIcon, ClockIcon } from '../components/icons';

interface RaceSelectorProps {
  onCourseSelect: (course: RaceCourse | null) => void;
  onRaceSelect: (race: Race | null) => void;
  disabled: boolean;
}

interface BackendRace {
    time: string;
    raceName: string;
    raceNumber: number;
}

export const RaceSelector: React.FC<RaceSelectorProps> = ({ 
    onCourseSelect, 
    onRaceSelect, 
    disabled 
}) => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);
    const [selectedCourseName, setSelectedCourseName] = useState<string>('');
    const [racesForCourse, setRacesForCourse] = useState<BackendRace[]>([]);
    const [selectedRaceTime, setSelectedRaceTime] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available courses when date changes
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(
                    `http://localhost:3001/api/racecourses?date=${selectedDate}&region=GB`
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch courses: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    setAvailableCourses(data.courses);
                    console.log(`✅ Loaded ${data.courses.length} courses for ${selectedDate}`);
                } else {
                    throw new Error(data.error || 'Failed to load courses');
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError(err instanceof Error ? err.message : 'Failed to load courses');
                setAvailableCourses([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchCourses();
        
        // Reset selections when date changes
        setSelectedCourseName('');
        setSelectedRaceTime('');
        setRacesForCourse([]);
        onCourseSelect(null);
        onRaceSelect(null);
    }, [selectedDate, onCourseSelect, onRaceSelect]);

    // Fetch races when course changes
    useEffect(() => {
        if (!selectedCourseName) {
            setRacesForCourse([]);
            onCourseSelect(null);
            return;
        }
        
        const fetchRaces = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(
                    `http://localhost:3001/api/races?course=${encodeURIComponent(selectedCourseName)}&date=${selectedDate}&region=GB`
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch races: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    setRacesForCourse(data.races);
                    console.log(`✅ Loaded ${data.races.length} races for ${selectedCourseName}`);
                    
                    // Notify parent with course info
                    onCourseSelect({
                        name: selectedCourseName,
                        code: selectedCourseName.substring(0, 3).toUpperCase(),
                        location: selectedCourseName + ', UK',
                    });
                } else {
                    throw new Error(data.error || 'Failed to load races');
                }
            } catch (err) {
                console.error('Error fetching races:', err);
                setError(err instanceof Error ? err.message : 'Failed to load races');
                setRacesForCourse([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchRaces();
        
        // Reset race selection
        setSelectedRaceTime('');
        onRaceSelect(null);
    }, [selectedCourseName, selectedDate, onCourseSelect, onRaceSelect]);

    // Handle race selection
    const handleRaceSelect = (raceTime: string) => {
        setSelectedRaceTime(raceTime);
        
        const race = racesForCourse.find(r => r.time === raceTime);
        
        if (race) {
            onRaceSelect({
                id: race.time,
                raceNumber: race.raceNumber.toString(),
                time: race.time,
                distance: 'Unknown', // Will be fetched with full details
                surface: 'Turf',
                raceType: race.raceName,
                horseCount: 0, // Will be populated during analysis
            });
        } else {
            onRaceSelect(null);
        }
    };

    // Generate date options (today ± 7 days)
    const dates = Array.from({ length: 15 }, (_, i) => addDays(new Date(), i - 7))
        .map(date => ({ 
            value: format(date, 'yyyy-MM-dd'), 
            label: format(date, 'eee, MMM do') 
        }));

    return (
        <Card>
            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded">
                    ⚠️ {error}
                    <div className="text-xs mt-1 text-red-400">
                        Make sure you've run: <code>python3 rpscrape/scripts/racecards.py today</code>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Selector */}
                <div>
                    <label htmlFor="date-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Race Date
                    </label>
                    <Select
                        id="date-select"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        disabled={disabled || loading}
                        options={dates}
                    />
                </div>

                {/* Course Selector */}
                <div>
                    <label htmlFor="course-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        Race Course
                    </label>
                    <Select
                        id="course-select"
                        value={selectedCourseName}
                        onChange={e => setSelectedCourseName(e.target.value)}
                        disabled={disabled || loading || availableCourses.length === 0}
                        options={[
                            { 
                                value: '', 
                                label: loading ? 'Loading courses...' : 
                                       availableCourses.length === 0 ? 'No courses available' :
                                       'Select a course' 
                            },
                            ...availableCourses.map(course => ({
                                value: course,
                                label: course,
                            }))
                        ]}
                    />
                </div>

                {/* Race Time Selector */}
                <div>
                    <label htmlFor="race-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Race Time
                    </label>
                    <Select
                        id="race-select"
                        value={selectedRaceTime}
                        onChange={e => handleRaceSelect(e.target.value)}
                        disabled={disabled || loading || !selectedCourseName || racesForCourse.length === 0}
                        options={[
                            { 
                                value: '', 
                                label: loading ? 'Loading races...' : 
                                       !selectedCourseName ? 'Select a course first' :
                                       racesForCourse.length === 0 ? 'No races available' :
                                       'Select a race' 
                            },
                            ...racesForCourse.map(race => ({
                                value: race.time,
                                label: `Race ${race.raceNumber} - ${race.time} - ${race.raceName}`,
                            }))
                        ]}
                    />
                </div>
            </div>

            {loading && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                    <span className="inline-block animate-pulse">Loading race data...</span>
                </div>
            )}
        </Card>
    );
};