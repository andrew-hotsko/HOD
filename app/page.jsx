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
  saveWorkoutRecord, loadWorkoutRecord, updateWorkoutRating, updateWorkoutNotes,
  getCachedWorkout, setCachedWorkout,
  loadEquipment, isOnboarded, setOnboarded, todayISO,
  loadRecentWorkoutSummaries, loadProfile, loadFamilyCode,
  loadRestDays, addRestDay, applyProgressionToItems,
} from '@/lib/storage';
import OnboardingScreen from '@/components/OnboardingScreen';
import ProfileScreen from '@/components/ProfileScreen';
import SettingsScreen from '@/components/SettingsScreen';
import FamilyCodeScreen from '@/components/FamilyCodeScreen';
import VoiceScreen from '@/components/VoiceScreen';
import HistoryDetailScreen from '@/components/HistoryDetailScreen';
import InstallPrompt from '@/components/InstallPrompt';

function assembleWorkout(params, apiWorkout) {
  const intense = INTENSITIES.find(i => i.key === params.intensity);
  const styleDef = STYLES[params.style];
  const progressedMain = {
    ...apiWorkout.main,
    items: applyProgressionToItems(apiWorkout.main.items),
  };
  // Prefer AI-tailored warmup if present; otherwise keep the fallback shape
  // (WarmupScreen will synthesize one locally if items is missing).
  const warmup = apiWorkout.warmup && Array.isArray(apiWorkout.warmup.items) && apiWorkout.warmup.items.length
    ? { label: 'WARMUP', duration: 5, note: apiWorkout.warmup.note || 'Prime for today', items: apiWorkout.warmup.items }
    : { label: 'WARMUP', duration: 5, note: '5 min — bike easy + dynamic mobility' };
  return {
    date: new Date().toISOString(),
    intensity: intense,
    style: { key: params.style, ...styleDef },
    format: apiWorkout.main.format,
    duration: params.duration,
    warmup,
    main: progressedMain,
    finisher: apiWorkout.finisher ?? null,
  };
}

export default function App() {
  const [screen, setScreen] = useState('today');
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [historyDates, setHistoryDates] = useState([]);
  const [restDays, setRestDays] = useState([]);
  const [detailDate, setDetailDate] = useState(null);
  const [yesterdayRecord, setYesterdayRecord] = useState(null);
  const [genKey, setGenKey] = useState(0);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setHistoryDates(loadHistoryDates());
    setRestDays(loadRestDays());
    const y = todayISO(new Date(Date.now() - 86400000));
    setYesterdayRecord(loadWorkoutRecord(y));
    if (!isOnboarded()) setScreen('onboarding-profile');
  }, []);

  const history14 = buildHistory14(historyDates, restDays);
  const todayIso = todayISO();
  const todayIsRestDay = restDays.includes(todayIso);
  const todayIsDone = historyDates.includes(todayIso);

  // Shared fetch — used by handleStart (first generation) and handleRegenerate.
  // Returns an assembled workout; caller is responsible for cache/publish side effects.
  const fetchWorkout = useCallback(async (params, { nudge = null } = {}) => {
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
          tweaks: Array.isArray(params.tweaks) ? params.tweaks : [],
          partnerMode: !!params.partnerMode,
          regenerateNudge: nudge,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return assembleWorkout(params, data.workout);
    } catch (err) {
      console.error('Workout generation failed, falling back:', err);
      const { generateHOD } = await import('@/lib/generator');
      return generateHOD({
        intensity: params.intensity,
        style: params.style,
        duration: params.duration,
        equipment: loadEquipment(),
      });
    }
  }, []);

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
      const workout = await fetchWorkout(params);
      setConfig(prev => ({ ...prev, workout }));
      setCachedWorkout(params, workout);
      publishFamilyWod(params, workout);
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchWorkout]);

  // Regenerate from the briefing — wipes the current workout, bumps genKey
  // to remount GenerateScreen (so the stamp/print animation plays again),
  // and re-fetches with an optional nudge hint ("different", "easier",
  // "harder") threaded into the API prompt.
  const handleRegenerate = useCallback(async (nudge = null) => {
    if (!config) return;
    const params = {
      intensity: config.intensity,
      style: config.style,
      duration: config.duration,
      tweaks: config.tweaks,
      partnerMode: config.partnerMode,
    };
    setGenKey(k => k + 1);
    setConfig(prev => ({ ...prev, workout: null }));
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const workout = await fetchWorkout(params, { nudge });
      setConfig(prev => ({ ...prev, workout }));
      // Overwrite today's cache with the new one so it sticks
      setCachedWorkout(params, workout);
      // Don't re-publish to family WOD on regen — first-writer-wins holds
    } finally {
      fetchingRef.current = false;
    }
  }, [config, fetchWorkout]);

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

  const handleNote = (notes) => {
    updateWorkoutNotes(todayISO(), notes);
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
  const handleSettingsEditVoice = () => setScreen('settings-voice');
  const handleBackToSettings = () => setScreen('settings');

  const handleRepeatYesterday = useCallback(() => {
    if (!yesterdayRecord) return;
    handleStart(yesterdayRecord.params, yesterdayRecord.workout);
  }, [handleStart, yesterdayRecord]);

  const handleMarkRestDay = useCallback(() => {
    const iso = todayISO();
    addRestDay(iso);
    setRestDays((prev) => prev.includes(iso) ? prev : [...prev, iso]);
    setHistoryDates((prev) => prev.includes(iso) ? prev : [...prev, iso]);
    // Post to family feed as a rest-day entry
    const code = loadFamilyCode();
    if (code) {
      const profile = loadProfile();
      fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          item: {
            name: (profile.name || '').trim(),
            role: profile.role,
            headline: 'REST DAY',
            style: 'REST',
            format: 'REST',
            duration: 0,
            elapsed: 0,
            rating: null,
            isPR: false,
          },
        }),
      }).catch(() => {});
    }
  }, []);

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
        partnered: !!params.partnerMode,
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
            onEditVoice={handleSettingsEditVoice}
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

        {screen === 'settings-voice' && (
          <VoiceScreen onDone={handleBackToSettings} onCancel={handleBackToSettings} />
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
              onMarkRestDay={handleMarkRestDay}
              todayIsDone={todayIsDone}
              todayIsRestDay={todayIsRestDay}
            />
            <InstallPrompt />
          </>
        )}

        {screen === 'history' && detailDate && (
          <HistoryDetailScreen iso={detailDate} onClose={handleCloseDetail} />
        )}

        {screen === 'warmup' && (
          <WarmupScreen onDone={handleWarmupDone} onSkip={handleWarmupSkip} workout={config?.workout} />
        )}

        {screen === 'generate' && config && (
          <GenerateScreen key={genKey} config={config} onReady={handleGenerateReady} onRegenerate={handleRegenerate} />
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
          <CompleteScreen config={config} stats={stats} onClose={handleComplete} onRate={handleRate} onNote={handleNote} />
        )}
      </div>
    </main>
  );
}
