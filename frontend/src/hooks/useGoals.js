import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const GOAL_QUERY_KEYS = {
  all: ['goals'],
};

export const useGoals = () => {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.all,
    queryFn: async () => {
      const res = await api.getGoals();
      return res.goals || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalData) => api.createGoal(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, goalData, ...rest }) => api.updateGoal(id, goalData || rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
