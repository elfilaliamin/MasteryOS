import { useState, useEffect, useRef } from 'react';
import { GamificationContext } from './gamificationContextInstance';
import { calculateGamification } from '../services/gamification';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export const GamificationProvider = ({ children, tasks = [], goals = [], courses = [], habits = [], isLoading = false }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const ackLevelKey = `mastery_acknowledged_level_${userId}`;
  const equippedTitleKey = `taskmaster_equipped_title_${userId}`;

  const [equippedTitleId, setEquippedTitleId] = useState(() => {
    return localStorage.getItem(equippedTitleKey) || 'starter';
  });

  const [levelUpData, setLevelUpData] = useState(null); // When user genuinely levels up
  const isInitializedRef = useRef(false);
  const previousLevelRef = useRef(null);
  const lastUserIdRef = useRef(userId);

  // Sync title from backend
  useEffect(() => {
    const handleTitleSync = (e) => {
      if (e.detail) {
        setEquippedTitleId(e.detail);
      }
    };
    window.addEventListener('taskmaster_title_sync', handleTitleSync);
    return () => window.removeEventListener('taskmaster_title_sync', handleTitleSync);
  }, []);

  const playerStats = calculateGamification(tasks, goals, courses, equippedTitleId, habits);

  useEffect(() => {
    // If user changed, reset initialization
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      isInitializedRef.current = false;
      previousLevelRef.current = null;
    }

    // Do NOT initialize baseline or evaluate level-up celebrations while server queries are loading!
    if (isLoading) {
      return;
    }

    const userAckLevel = user?.settings?.acknowledgedLevel;
    const savedLevel = localStorage.getItem(ackLevelKey) || (userAckLevel ? String(userAckLevel) : null);

    // If not initialized yet, initialize from localStorage / backend settings or current level
    if (!isInitializedRef.current) {
      const parsedSaved = savedLevel ? parseInt(savedLevel, 10) : null;
      const ackLevel = Number.isInteger(parsedSaved) ? parsedSaved : playerStats.level;

      if (!savedLevel) {
        localStorage.setItem(ackLevelKey, String(playerStats.level));
        if (user?.id) {
          api.updateSettings({ acknowledgedLevel: playerStats.level }).catch(() => {});
        }
      }

      previousLevelRef.current = Math.max(playerStats.level, ackLevel);
      isInitializedRef.current = true;
      return;
    }

    // Live session: user is already initialized.
    // Trigger Level Up Celebration ONLY if current level strictly exceeds previous level
    // and strictly exceeds the highest acknowledged level in localStorage/settings!
    const parsedSaved = savedLevel ? parseInt(savedLevel, 10) : null;
    const highestAckLevel = Number.isInteger(parsedSaved) ? parsedSaved : (previousLevelRef.current || 1);

    if (playerStats.level > highestAckLevel && playerStats.level > (previousLevelRef.current || 1)) {
      setLevelUpData({
        level: playerStats.level,
        title: playerStats.levelTitle,
        icon: playerStats.levelIcon,
        totalXp: playerStats.totalXp,
      });
      localStorage.setItem(ackLevelKey, String(playerStats.level));
      if (user?.id) {
        api.updateSettings({ acknowledgedLevel: playerStats.level }).catch(() => {});
      }
    }

    previousLevelRef.current = playerStats.level;
  }, [userId, isLoading, playerStats.level, playerStats.levelTitle, playerStats.levelIcon, playerStats.totalXp, ackLevelKey, user?.settings?.acknowledgedLevel, user?.id]);

  const equipTitle = (titleId) => {
    setEquippedTitleId(titleId);
    localStorage.setItem(equippedTitleKey, titleId);
    if (user?.id) {
      api.updateSettings({ equippedTitleId: titleId }).catch(() => {});
    }
  };

  const closeLevelUpModal = () => {
    if (levelUpData) {
      localStorage.setItem(ackLevelKey, String(levelUpData.level));
      if (user?.id) {
        api.updateSettings({ acknowledgedLevel: levelUpData.level }).catch(() => {});
      }
    }
    setLevelUpData(null);
  };

  return (
    <GamificationContext.Provider
      value={{
        playerStats,
        equippedTitleId,
        equipTitle,
        levelUpData,
        closeLevelUpModal,
        isLoading,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};
