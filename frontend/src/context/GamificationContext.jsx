import { useState, useEffect, useRef } from 'react';
import { GamificationContext } from './gamificationContextInstance';
import { calculateGamification } from '../services/gamification';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export const GamificationProvider = ({ children, tasks = [], goals = [], courses = [], habits = [] }) => {
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

    // If not initialized yet, initialize from localStorage or current level
    if (!isInitializedRef.current) {
      const savedLevel = localStorage.getItem(ackLevelKey);
      const ackLevel = savedLevel ? parseInt(savedLevel, 10) : playerStats.level;

      if (!savedLevel) {
        localStorage.setItem(ackLevelKey, String(playerStats.level));
      }

      previousLevelRef.current = Math.max(playerStats.level, ackLevel);
      isInitializedRef.current = true;
      return;
    }

    // Live session: user is already initialized.
    // Trigger Level Up Celebration ONLY if current level strictly exceeds previous level
    // and strictly exceeds the highest acknowledged level in localStorage!
    const savedLevel = localStorage.getItem(ackLevelKey);
    const highestAckLevel = savedLevel ? parseInt(savedLevel, 10) : (previousLevelRef.current || 1);

    if (playerStats.level > highestAckLevel && playerStats.level > (previousLevelRef.current || 1)) {
      setLevelUpData({
        level: playerStats.level,
        title: playerStats.levelTitle,
        icon: playerStats.levelIcon,
        totalXp: playerStats.totalXp,
      });
      localStorage.setItem(ackLevelKey, String(playerStats.level));
    }

    previousLevelRef.current = playerStats.level;
  }, [userId, playerStats.level, playerStats.levelTitle, playerStats.levelIcon, playerStats.totalXp, ackLevelKey]);

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
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};
