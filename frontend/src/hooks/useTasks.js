import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const TASK_QUERY_KEYS = {
  all: ['tasks'],
  list: (params = {}) => ['tasks', params],
  stats: ['tasks', 'stats'],
  detail: (id) => ['tasks', id],
};

export const useTasks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list(params),
    queryFn: async () => {
      const res = await api.getTasks(params);
      return res.tasks || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

export const useTaskStats = (options = {}) => {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.stats,
    queryFn: async () => {
      const res = await api.getStats();
      return res.stats || {};
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskData) => api.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskData, ...rest }) => api.updateTask(id, taskData || rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.all });
      const previousTasks = queryClient.getQueryData(TASK_QUERY_KEYS.list({}));

      if (previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.list({}), (old = []) =>
          old.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
                }
              : t
          )
        );
      }
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.list({}), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
