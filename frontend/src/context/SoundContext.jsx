import { useState, useEffect, useCallback } from 'react';
import { SoundContext } from './soundContextInstance';
import { soundService } from '../services/soundService';
import { api } from '../services/api';

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMutedState] = useState(() => soundService.loadMutedState());
  const [volume, setVolumeState] = useState(() => soundService.loadVolumeState());

  // Listen to internal soundService custom events
  useEffect(() => {
    const handleSoundStateChange = (e) => {
      if (e.detail) {
        if (typeof e.detail.isMuted === 'boolean') {
          setIsMutedState(e.detail.isMuted);
        }
        if (typeof e.detail.volume === 'number') {
          setVolumeState(e.detail.volume);
        }
      }
    };
    window.addEventListener('mastery_sound_state_change', handleSoundStateChange);
    return () => window.removeEventListener('mastery_sound_state_change', handleSoundStateChange);
  }, []);

  // Listen for settings sync from backend
  useEffect(() => {
    const handleSettingsSync = (e) => {
      const soundEnabled = e.detail?.soundEnabled;
      const soundVol = e.detail?.soundVolume;

      if (typeof soundEnabled === 'boolean') {
        const nextMuted = !soundEnabled;
        soundService.setIsMuted(nextMuted);
        setIsMutedState(nextMuted);
      }
      if (typeof soundVol === 'number' && soundVol >= 0 && soundVol <= 1) {
        soundService.setVolume(soundVol);
        setVolumeState(soundVol);
      }
    };
    window.addEventListener('taskmaster_settings_sync', handleSettingsSync);
    return () => window.removeEventListener('taskmaster_settings_sync', handleSettingsSync);
  }, []);

  const setIsMuted = useCallback((muted) => {
    soundService.setIsMuted(muted);
    setIsMutedState(Boolean(muted));
    api.updateSettings({ soundEnabled: !muted }).catch(() => {});
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = soundService.toggleMute();
    setIsMutedState(nextMuted);
    api.updateSettings({ soundEnabled: !nextMuted }).catch(() => {});
    return nextMuted;
  }, []);

  const setVolume = useCallback((vol) => {
    soundService.setVolume(vol);
    setVolumeState(soundService.volume);
    api.updateSettings({ soundVolume: soundService.volume }).catch(() => {});
  }, []);

  const playSound = useCallback((type) => {
    soundService.playSound(type);
  }, []);

  const playTaskComplete = useCallback(() => {
    soundService.playTaskComplete();
  }, []);

  const playLessonComplete = useCallback(() => {
    soundService.playLessonComplete();
  }, []);

  const playCourseComplete = useCallback(() => {
    soundService.playCourseComplete();
  }, []);

  const playGoalComplete = useCallback(() => {
    soundService.playGoalComplete();
  }, []);

  const playHabitCheck = useCallback(() => {
    soundService.playHabitCheck();
  }, []);

  const playLevelUp = useCallback(() => {
    soundService.playLevelUp();
  }, []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        volume,
        setIsMuted,
        toggleMute,
        setVolume,
        playSound,
        playTaskComplete,
        playLessonComplete,
        playCourseComplete,
        playGoalComplete,
        playHabitCheck,
        playLevelUp,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
