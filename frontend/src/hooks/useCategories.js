import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'],
};

export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.all,
    queryFn: async () => {
      const res = await api.getCategories();
      return res.categories || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryData) => api.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
