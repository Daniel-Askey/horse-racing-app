import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { RaceSelector } from './components/RaceSelector';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsDisplay } from './components/ResultsDisplay';
import { useRaceAnalysis } from './hooks/useRaceAnalysis';
import type { Race, RaceCourse } from './types';
import { Button } from './components/ui/Button';
import { SparklesIcon } from './components/icons';
import { checkBackendHealth, fetchRaceDataFromBackend } from './services/backendService';

const App: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<RaceCourse | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(isRunning => {
        if (!isRunning) {
            console.warn('⚠️ Backend is not running. Start it with: npm run dev');
            setBackendStatus('offline');
        } else {
            console.log('✅ Backend is connected');
            setBackendStatus('online');
        }
    });
  }, []);

  const { status, progress, results, error, analyzeRace } = useRaceAnalysis();

  const handleAnalyzeClick = useCallback(() => {
    if (selectedRace && selectedCourse) {
      analyzeRace(selectedCourse, selectedRace);
    }
  }, [selectedCourse, selectedRace, analyzeRace]);

  // Test backend connection function
  const testBackendConnection = async () => {
    console.log('🧪 Testing backend connection...');
    
    // Check if backend is running
    const isRunning = await checkBackendHealth();
    console.log('Backend running:', isRunning ? '✅ YES' : '❌ NO');
    
    if (!isRunning) {
      alert('⚠️ Backend is NOT running!\n\nStart it in VS Code:\n1. Open terminal\n2. cd backend\n3. Run: npm run dev');
      setBackendStatus('offline');
      return;
    }
    
    setBackendStatus('online');
    
    // Test fetching race data
    try {
      const result = await fetchRaceDataFromBackend(
        'Churchill Downs',
        '2026-01-29',
        '16:10'
      );
      
      console.log('✅ Backend response:', result);
      
      if (result.success) {
        alert(`✅ SUCCESS!\n\nFound ${result.data.horses.length} horses\nSource: ${result.data.source}\n\nCheck browser console (F12) for full details.`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Failed to fetch race data:\n\n' + error);
      setBackendStatus('offline');
    }
  };

  const canAnalyze = selectedCourse && selectedRace && status !== 'loading';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      
      {/* Backend Status Indicator */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`}></div>
              <span className="text-gray-400">
                Backend: {
                  backendStatus === 'online' ? '✅ Connected' : 
                  backendStatus === 'offline' ? '❌ Offline' : 
                  '⏳ Checking...'
                }
              </span>
            </div>
            <button
              onClick={testBackendConnection}
              className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
            >
              🧪 Test Connection
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <RaceSelector
            onCourseSelect={setSelectedCourse}
            onRaceSelect={setSelectedRace}
            disabled={status === 'loading'}
          />

          <div className="text-center">
            <Button
              onClick={handleAnalyzeClick}
              disabled={!canAnalyze}
              size="lg"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Analyze Race
            </Button>
          </div>
          
          {status === 'loading' && <AnalysisProgress progress={progress} />}
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
              <h3 className="font-bold text-lg">Analysis Error</h3>
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}
          
          {status === 'success' && results && <ResultsDisplay results={results} />}

          {status === 'idle' && !results && (
            <div className="text-center text-gray-500 pt-8">
              <p>Select a date, course, and race to begin your AI-powered analysis.</p>
              {backendStatus === 'offline' && (
                <p className="text-red-400 mt-4">
                  ⚠️ Backend server is offline. Start it in VS Code to analyze races.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;