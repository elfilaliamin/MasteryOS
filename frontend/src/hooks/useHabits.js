import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatDateKey, calculateHabitStats } from '../utils/habitUtils';

export const HABIT_QUERY_KEYS = {
  all: ['habits'],
};

export const useHabits = (options = {}) => {
  return useQuery({
    queryKey: HABIT_QUERY_KEYS.all,
    queryFn: async () => {
      const res = await api.getHabits();
      return res.habits || [];
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitData) => api.createHabit(habitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEYS.all });
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, habitData, ...rest }) => api.updateHabit(id, habitData || rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEYS.all });
    },
  });
};

export const useToggleHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, dateStr }) => api.toggleHabit(id, date || dateStr),
    onMutate: async ({ id, date, dateStr }) => {
      await queryClient.cancelQueries({ queryKey: HABIT_QUERY_KEYS.all });
      const previousHabits = queryClient.getQueryData(HABIT_QUERY_KEYS.all);
      const targetDateKey = date || dateStr || formatDateKey(new Date());

      if (previousHabits) {
        queryClient.setQueryData(HABIT_QUERY_KEYS.all, (old = []) =>
          old.map((h) => {
            if (h.id === id) {
              const currentDates = h.completed_dates || [];
              const exists = currentDates.includes(targetDateKey);
              const nextDates = exists
                ? currentDates.filter((d) => d !== targetDateKey)
                : [...currentDates, targetDateKey];
              const stats = calculateHabitStats(nextDates);

              return {
                ...h,
                completed_dates: nextDates,
                current_streak: stats.currentStreak,
                longest_streak: Math.max(h.longest_streak || 0, stats.longestStreak),
                is_completed_today: nextDates.includes(formatDateKey(new Date())),
              };
            }
            return h;
          })
        );
      }
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(HABIT_QUERY_KEYS.all, context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEYS.all });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEYS.all });
    },
  });
};
