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
  saveWorkoutRecord, loadWorkoutRecord, updateWorkoutRating,
  getCachedWorkout, setCachedWorkout,
  loadEquipment, isOnboarded, setOnboarded, todayISO,
  loadRecentWorkoutSummaries, loadProfile, loadFamilyCode,
} from '@/lib/storage';
import OnboardingScreen from '@/components/OnboardingScreen';
import ProfileScreen from '@/components/ProfileScreen';
import SettingsScreen from '@/components/SettingsScreen';
import FamilyCodeScreen from '@/components/FamilyCodeScreen';
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
  const [yesterdayRecord, setYesterdayRecord] = useState(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setHistoryDates(loadHistoryDates());
    const y = todayISO(new Date(Date.now() - 86400000));
    setYesterdayRecord(loadWorkoutRecord(y));
    if (!isOnboarded()) setScreen('onboarding-profile');
  }, []);

  const history14 = buildHistory14(historyDates);

  const handleStart = useCallback(async (params, preloaded = null) => {
    setConfig({ ...params, workout: preloaded });
    setScreen('warmup');

    if (preloaded) return;

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
          recentHistory: loadRecentWorkoutSummaries(7),
          profile: loadProfile(),
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const workout = assembleWorkout(params, data.workout);
      setConfig(prev => ({ ...prev, workout }));
      setCachedWorkout(params, workout);
      publishFamilyWod(params, workout);
    } catch (err) {
      console.error('Workout generation failed:', err);
      const { generateHOD } = await import('@/lib/generator');
      const workout = generateHOD({
        intensity: params.intensity,
        style: params.style,
        duration: params.duration,
        equipment: loadEquipment(),
      });
      setConfig(prev => ({ ...prev, workout }));
      setCachedWorkout(params, workout);
      publishFamilyWod(params, workout);
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

  const handleProfileOnboardingNext = () => setScreen('onboarding-equipment');
  const handleOnboardingDone = () => {
    setOnboarded(true);
    setScreen('today');
  };

  const handleOpenSettings = () => setScreen('settings');
  const handleSettingsClose = () => setScreen('today');
  const handleSettingsEditProfile = () => setScreen('settings-profile');
  const handleSettingsEditEquipment = () => setScreen('settings-equipment');
  const handleSettingsEditFamily = () => setScreen('settings-family');
  const handleBackToSettings = () => setScreen('settings');

  const handleRepeatYesterday = useCallback(() => {
    if (!yesterdayRecord) return;
    handleStart(yesterdayRecord.params, yesterdayRecord.workout);
  }, [handleStart, yesterdayRecord]);

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
      postToFamilyFeed(config, finalStats);
    }
  };

  function publishFamilyWod(params, workout) {
    const code = loadFamilyCode();
    if (!code) return;
    const profile = loadProfile();
    fetch('/api/wod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        date: todayISO(),
        author: (profile.name || '').trim(),
        params: {
          intensity: params.intensity,
          style: params.style,
          duration: params.duration,
        },
        headline: workout?.main?.headline || '',
      }),
    }).catch(() => {});
  }

  function postToFamilyFeed(cfg, finalStats) {
    const code = loadFamilyCode();
    if (!code) return;
    const profile = loadProfile();
    const item = {
      name: (profile.name || '').trim(),
      role: profile.role,
      headline: cfg.workout?.main?.headline || '',
      style: cfg.workout?.style?.label || cfg.style || '',
      format: cfg.workout?.main?.format || '',
      duration: cfg.duration,
      elapsed: finalStats?.elapsed || 0,
      rating: null,
      isPR: false,
    };
    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, item }),
    }).catch(() => {});
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: V('ink') }}>
      <div className="hod-screen" style={{ flex: 1 }}>
        {screen === 'onboarding-profile' && (
          <ProfileScreen mode="onboarding" onNext={handleProfileOnboardingNext} />
        )}

        {screen === 'onboarding-equipment' && (
          <OnboardingScreen onDone={handleOnboardingDone} />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            onClose={handleSettingsClose}
            onEditProfile={handleSettingsEditProfile}
            onEditEquipment={handleSettingsEditEquipment}
            onEditFamily={handleSettingsEditFamily}
          />
        )}

        {screen === 'settings-profile' && (
          <ProfileScreen mode="edit" onDone={handleBackToSettings} onCancel={handleBackToSettings} />
        )}

        {screen === 'settings-equipment' && (
          <OnboardingScreen mode="edit" onDone={handleBackToSettings} onCancel={handleBackToSettings} />
        )}

        {screen === 'settings-family' && (
          <FamilyCodeScreen onDone={handleBackToSettings} onCancel={handleBackToSettings} />
        )}

        {screen === 'today' && (
          <>
            <TodayScreen
              onStart={handleStart}
              history={history14}
              onOpenDay={handleOpenDetail}
              yesterdayRecord={yesterdayRecord}
              onRepeatYesterday={handleRepeatYesterday}
              onOpenSettings={handleOpenSettings}
            />
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
