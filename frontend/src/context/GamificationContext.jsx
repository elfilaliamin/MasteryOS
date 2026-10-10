import { useState, useEffect, useRef } from 'react';
import { GamificationContext } from './gamificationContextInstance';
import { calculateGamification } from '../services/gamification';

export const GamificationProvider = ({ children, tasks = [], goals = [], courses = [] }) => {
  const [equippedTitleId, setEquippedTitleId] = useState(() => {
    return localStorage.getItem('taskmaster_equipped_title') || 'starter';
  });

  const [levelUpData, setLevelUpData] = useState(null); // When user genuinely levels up
  const isInitializedRef = useRef(false);
  const previousLevelRef = useRef(null);

  const playerStats = calculateGamification(tasks, goals, courses, equippedTitleId);

  useEffect(() => {
    // If not initialized yet, wait until initial data is available
    if (!isInitializedRef.current) {
      // If data is still loading (all arrays empty), wait for next render
      if (tasks.length === 0 && goals.length === 0 && courses.length === 0) {
        return;
      }

      // Initialize acknowledged level from localStorage or current level
      const savedLevel = localStorage.getItem('mastery_acknowledged_level');
      const ackLevel = savedLevel ? parseInt(savedLevel, 10) : playerStats.level;

      if (!savedLevel) {
        localStorage.setItem('mastery_acknowledged_level', String(playerStats.level));
      }

      previousLevelRef.current = Math.max(playerStats.level, ackLevel);
      isInitializedRef.current = true;
      return;
    }

    // Live session: user is already initialized.
    // Trigger Level Up Celebration ONLY if current level strictly exceeds previous level
    // and strictly exceeds the highest acknowledged level in localStorage!
    const savedLevel = localStorage.getItem('mastery_acknowledged_level');
    const highestAckLevel = savedLevel ? parseInt(savedLevel, 10) : (previousLevelRef.current || 1);

    if (playerStats.level > highestAckLevel && playerStats.level > (previousLevelRef.current || 1)) {
      setLevelUpData({
        level: playerStats.level,
        title: playerStats.levelTitle,
        icon: playerStats.levelIcon,
        totalXp: playerStats.totalXp,
      });
      localStorage.setItem('mastery_acknowledged_level', String(playerStats.level));
    }

    previousLevelRef.current = playerStats.level;
  }, [playerStats.level, playerStats.levelTitle, playerStats.levelIcon, playerStats.totalXp, tasks.length, goals.length, courses.length]);

  const equipTitle = (titleId) => {
    setEquippedTitleId(titleId);
    localStorage.setItem('taskmaster_equipped_title', titleId);
  };

  const closeLevelUpModal = () => {
    if (levelUpData) {
      localStorage.setItem('mastery_acknowledged_level', String(levelUpData.level));
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
