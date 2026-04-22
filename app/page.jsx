'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { V } from '@/components/atoms';
import { INTENSITIES, STYLES } from '@/lib/generator';
import TodayScreen from '@/components/TodayScreen';
import GenerateScreen from '@/components/GenerateScreen';
import LiveScreen from '@/components/LiveScreen';
import CompleteScreen from '@/components/CompleteScreen';
import { WarmupScreen, FinisherScreen } from '@/components/FlowScreens';

const HISTORY_KEY = 'hod.history';

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(dates) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(dates));
}

function buildHistory14(dates) {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().split('T')[0];
    return dates.includes(iso);
  });
}

function assembleWorkout(params, apiWorkout) {
  const intense = INTENSITIES.find(i => i.key === params.intensity);
  const styleDef = STYLES[params.style];
  return {
    date: new Date().toISOString(),
    intensity: intense,
    style: { key: params.style, ...styleDef },
    format: apiWorkout.main.format,
    duration: params.duration,
    warmup: { label: 'WARMUP', duration: 5, note: '5 min — bike easy + dynamic mobility' },
    main: apiWorkout.main,
    finisher: apiWorkout.finisher ?? null,
  };
}

export default function App() {
  const [screen, setScreen] = useState('today');
  const [config, setConfig] = useState(null);
  const [historyDates, setHistoryDates] = useState([]);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setHistoryDates(loadHistory());
  }, []);

  const history14 = buildHistory14(historyDates);

  const handleStart = useCallback(async (params) => {
    // Build a shell config immediately (without workout) so Generate screen can start
    setConfig({ ...params, workout: null });
    setScreen('warmup');

    // Start fetching the AI workout in parallel with warmup
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensity: params.intensity,
          style: params.style,
          duration: params.duration,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const workout = assembleWorkout(params, data.workout);
      setConfig(prev => ({ ...prev, workout }));
    } catch (err) {
      console.error('Workout generation failed:', err);
      // Fallback: import and run the JS generator
      const { generateHOD } = await import('@/lib/generator');
      const workout = generateHOD({
        intensity: params.intensity,
        style: params.style,
        duration: params.duration,
      });
      setConfig(prev => ({ ...prev, workout }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const handleWarmupDone = () => setScreen('generate');
  const handleWarmupSkip = () => setScreen('generate');
  const handleGenerateReady = () => setScreen('live');

  const handleLiveFinish = () => {
    if (config?.workout?.finisher) {
      setScreen('finisher');
    } else {
      markComplete();
      setScreen('complete');
    }
  };

  const handleFinisherDone = () => {
    markComplete();
    setScreen('complete');
  };

  const handleComplete = () => {
    setConfig(null);
    setScreen('today');
  };

  const markComplete = () => {
    const iso = new Date().toISOString().split('T')[0];
    setHistoryDates(prev => {
      const updated = prev.includes(iso) ? prev : [...prev, iso];
      saveHistory(updated);
      return updated;
    });
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: V('ink') }}>
      <div className="hod-screen" style={{ flex: 1 }}>
        {screen === 'today' && (
          <TodayScreen onStart={handleStart} history={history14} />
        )}

        {screen === 'warmup' && (
          <WarmupScreen onDone={handleWarmupDone} onSkip={handleWarmupSkip} />
        )}

        {screen === 'generate' && config && (
          <GenerateScreen config={config} onReady={handleGenerateReady} />
        )}

        {screen === 'live' && config?.workout && (
          <LiveScreen
            config={config}
            onFinish={handleLiveFinish}
            onExit={() => {
              setConfig(null);
              setScreen('today');
            }}
          />
        )}

        {screen === 'finisher' && config?.workout && (
          <FinisherScreen config={config} onDone={handleFinisherDone} />
        )}

        {screen === 'complete' && config?.workout && (
          <CompleteScreen config={config} onClose={handleComplete} />
        )}
      </div>
    </main>
  );
}
