
import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { RACE_COURSES, RACES_BY_COURSE } from '../constants';
import type { Race, RaceCourse } from '../types';
import { CalendarIcon, MapPinIcon, ClockIcon } from '../components/icons';

interface RaceSelectorProps {
  onCourseSelect: (course: RaceCourse | null) => void;
  onRaceSelect: (race: Race | null) => void;
  disabled: boolean;
}

export const RaceSelector: React.FC<RaceSelectorProps> = ({ onCourseSelect, onRaceSelect, disabled }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [racesForCourse, setRacesForCourse] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');

  useEffect(() => {
  if (!selectedCourseId) {
    setRacesForCourse([]);
    setSelectedRaceId('');
    onCourseSelect(null);
    onRaceSelect(null);
    return;
  }

  const course = RACE_COURSES.find(c => c.code === selectedCourseId) || null;
  onCourseSelect(course);

  const races = RACES_BY_COURSE[selectedCourseId] ?? [];
  setRacesForCourse(races);

  setSelectedRaceId('');
  onRaceSelect(null);
}, [selectedCourseId]);

  
  useEffect(() => {
    // Reset selections when date changes
    setSelectedCourseId('');
    onCourseSelect(null);
    setSelectedRaceId('');
    onRaceSelect(null);
  }, [selectedDate, onCourseSelect, onRaceSelect]);

  const handleRaceSelect = (raceId: string) => {
    setSelectedRaceId(raceId);
    const race = racesForCourse.find(r => r.id === raceId) || null;
    onRaceSelect(race);
  };
  
  const dates = Array.from({ length: 15 }, (_, i) => addDays(new Date(), i - 7))
    .map(date => ({ value: format(date, 'yyyy-MM-dd'), label: format(date, 'eee, MMM do') }));

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Race Date
          </label>
          <Select
            id="date-select"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            disabled={disabled}
            options={dates}
          />
        </div>
        <div>
          <label htmlFor="course-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <MapPinIcon className="w-4 h-4 mr-2" />
            Race Course
          </label>
          <Select
            id="course-select"
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            disabled={disabled}
            options={[
              { value: '', label: 'Select a course' },
              ...RACE_COURSES.map(c => ({ value: c.code, label: `${c.name} (${c.location})` }))
            ]}
          />
        </div>
        <div>
          <label htmlFor="race-select" className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <ClockIcon className="w-4 h-4 mr-2" />
            Race Time
          </label>
          <Select
            id="race-select"
            value={selectedRaceId}
            onChange={e => handleRaceSelect(e.target.value)}
            disabled={disabled || !selectedCourseId}
            options={[
                { value: '', label: 'Select a race' },
                ...racesForCourse.map(r => ({ value: r.id, label: `Race ${r.raceNumber} - ${r.time} - ${r.distance}` }))
            ]}
          />
        </div>
      </div>
    </Card>
  );
};
