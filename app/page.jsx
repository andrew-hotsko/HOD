'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { V } from '@/components/atoms';
import { INTENSITIES, STYLES } from '@/lib/generator';
import TodayScreen from '@/components/TodayScreen';
import GenerateScreen from '@/components/GenerateScreen';
import LiveScreen from '@/components/LiveScreen';
import CompleteScreen from '@/components/CompleteScreen';
import { WarmupScreen, FinisherScreen } from '@/components/FlowScreens';
import {
  loadHistoryDates, addHistoryDate, buildHistory14,
  saveWorkoutRecord, updateWorkoutRating,
  getCachedWorkout, setCachedWorkout,
  loadEquipment, isOnboarded, setOnboarded, todayISO,
} from '@/lib/storage';
import OnboardingScreen from '@/components/OnboardingScreen';
import HistoryDetailScreen from '@/components/HistoryDetailScreen';
import InstallPrompt from '@/components/InstallPrompt';

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
  const [stats, setStats] = useState(null);
  const [historyDates, setHistoryDates] = useState([]);
  const [detailDate, setDetailDate] = useState(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setHistoryDates(loadHistoryDates());
    if (!isOnboarded()) setScreen('onboarding');
  }, []);

  const history14 = buildHistory14(historyDates);

  const handleStart = useCallback(async (params) => {
    setConfig({ ...params, workout: null });
    setScreen('warmup');

    // Cache hit: same date + same params → skip the API round-trip
    const cached = getCachedWorkout(params);
    if (cached) {
      setConfig(prev => ({ ...prev, workout: cached }));
      return;
    }

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
          equipment: loadEquipment(),
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const workout = assembleWorkout(params, data.workout);
      setConfig(prev => ({ ...prev, workout }));
      setCachedWorkout(params, workout);
    } catch (err) {
      console.error('Workout generation failed:', err);
      const { generateHOD } = await import('@/lib/generator');
      const workout = generateHOD({
        intensity: params.intensity,
        style: params.style,
        duration: params.duration,
      });
      setConfig(prev => ({ ...prev, workout }));
      setCachedWorkout(params, workout);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const handleWarmupDone = () => setScreen('generate');
  const handleWarmupSkip = () => setScreen('generate');
  const handleGenerateReady = () => setScreen('live');

  const handleLiveFinish = (finalStats) => {
    setStats(finalStats);
    if (config?.workout?.finisher) {
      setScreen('finisher');
    } else {
      markComplete(finalStats);
      setScreen('complete');
    }
  };

  const handleFinisherDone = () => {
    markComplete(stats);
    setScreen('complete');
  };

  const handleComplete = () => {
    setConfig(null);
    setStats(null);
    setScreen('today');
  };

  const handleRate = (rating) => {
    updateWorkoutRating(todayISO(), rating);
  };

  const handleOnboardingDone = () => {
    setOnboarded(true);
    setScreen('today');
  };

  const handleOpenDetail = (iso) => {
    setDetailDate(iso);
    setScreen('history');
  };

  const handleCloseDetail = () => {
    setDetailDate(null);
    setScreen('today');
  };

  const markComplete = (finalStats) => {
    const iso = todayISO();
    const updated = addHistoryDate(iso);
    setHistoryDates(updated);
    if (config?.workout) {
      saveWorkoutRecord({
        date: iso,
        params: { intensity: config.intensity, style: config.style, duration: config.duration },
        workout: config.workout,
        stats: finalStats || null,
        rating: null,
      });
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: V('ink') }}>
      <div className="hod-screen" style={{ flex: 1 }}>
        {screen === 'onboarding' && (
          <OnboardingScreen onDone={handleOnboardingDone} />
        )}

        {screen === 'today' && (
          <>
            <TodayScreen onStart={handleStart} history={history14} onOpenDay={handleOpenDetail} />
            <InstallPrompt />
          </>
        )}

        {screen === 'history' && detailDate && (
          <HistoryDetailScreen iso={detailDate} onClose={handleCloseDetail} />
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
          <CompleteScreen config={config} stats={stats} onClose={handleComplete} onRate={handleRate} />
        )}
      </div>
    </main>
  );
}
