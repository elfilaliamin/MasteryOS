import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const COURSE_QUERY_KEYS = {
  all: ['courses'],
};

export const useCourses = () => {
  return useQuery({
    queryKey: COURSE_QUERY_KEYS.all,
    queryFn: async () => {
      const res = await api.getCourses();
      return res.courses || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseData) => api.createCourse(courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courseData, ...rest }) => api.updateCourse(id, courseData || rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useIncrementCourseLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.incrementCourseLesson(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: COURSE_QUERY_KEYS.all });
      const previousCourses = queryClient.getQueryData(COURSE_QUERY_KEYS.all);

      if (previousCourses) {
        queryClient.setQueryData(COURSE_QUERY_KEYS.all, (old = []) =>
          old.map((c) =>
            c.id === id
              ? {
                  ...c,
                  finished_lessons: Math.min((c.finished_lessons || 0) + 1, c.total_lessons || 1),
                  progress_percent: Math.min(
                    100,
                    Math.round((((c.finished_lessons || 0) + 1) / (c.total_lessons || 1)) * 100)
                  ),
                }
              : c
          )
        );
      }
      return { previousCourses };
    },
    onError: (err, id, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(COURSE_QUERY_KEYS.all, context.previousCourses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.all });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
