const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

const getHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('master_tasks_token');
  const csrfToken = getCookie('XSRF-TOKEN');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
};

const fetchClient = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: getHeaders(options.headers)
  });
};

export const api = {
  // Auth endpoints
  async login(email, password) {
    const res = await fetchClient(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(full_name, email, password) {
    const res = await fetchClient(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    });
    return handleResponse(res);
  },

  async logout() {
    try {
      const res = await fetchClient(`${API_BASE}/auth/logout`, {
        method: 'POST',
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn('Logout notice:', err.message);
    }
  },

  async getMe() {
    const res = await fetchClient(`${API_BASE}/auth/me`);
    return handleResponse(res);
  },

  async changePassword(current_password, new_password) {
    const res = await fetchClient(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
    return handleResponse(res);
  },

  async updateProfile(full_name, avatar_url) {
    const res = await fetchClient(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify({ full_name, avatar_url }),
    });
    return handleResponse(res);
  },

  async updateSettings(settings) {
    const res = await fetchClient(`${API_BASE}/auth/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
    return handleResponse(res);
  },

  async resetUserData() {
    const res = await fetchClient(`${API_BASE}/auth/reset-data`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Task endpoints
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.search) query.append('search', params.search);

    const url = `${API_BASE}/tasks${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetchClient(url);
    return handleResponse(res);
  },

  async getTask(id) {
    const res = await fetchClient(`${API_BASE}/tasks/${id}`);
    return handleResponse(res);
  },

  async createTask(taskData) {
    const res = await fetchClient(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async updateTask(id, taskData) {
    const res = await fetchClient(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async updateTaskStatus(id, status) {
    const res = await fetchClient(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async deleteTask(id) {
    const res = await fetchClient(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getStats() {
    const res = await fetchClient(`${API_BASE}/tasks/stats`);
    return handleResponse(res);
  },

  // Category endpoints
  async getCategories() {
    const res = await fetchClient(`${API_BASE}/categories`);
    return handleResponse(res);
  },

  async createCategory(categoryData) {
    const res = await fetchClient(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res);
  },

  async deleteCategory(id) {
    const res = await fetchClient(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Goals endpoints
  async getGoals() {
    const res = await fetchClient(`${API_BASE}/goals`);
    return handleResponse(res);
  },

  async createGoal(goalData) {
    const res = await fetchClient(`${API_BASE}/goals`, {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
    return handleResponse(res);
  },

  async updateGoal(id, goalData) {
    const res = await fetchClient(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
    return handleResponse(res);
  },

  async deleteGoal(id) {
    const res = await fetchClient(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Courses endpoints
  async getCourses() {
    const res = await fetchClient(`${API_BASE}/courses`);
    return handleResponse(res);
  },

  async createCourse(courseData) {
    const res = await fetchClient(`${API_BASE}/courses`, {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async updateCourse(id, courseData) {
    const res = await fetchClient(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async incrementCourseLesson(id) {
    const res = await fetchClient(`${API_BASE}/courses/${id}/increment`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async deleteCourse(id) {
    const res = await fetchClient(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Habits endpoints
  async getHabits() {
    const res = await fetchClient(`${API_BASE}/habits`);
    return handleResponse(res);
  },

  async createHabit(habitData) {
    const res = await fetchClient(`${API_BASE}/habits`, {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
    return handleResponse(res);
  },

  async updateHabit(id, habitData) {
    const res = await fetchClient(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
    return handleResponse(res);
  },

  async toggleHabit(id, date = null) {
    const res = await fetchClient(`${API_BASE}/habits/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    return handleResponse(res);
  },

  async deleteHabit(id) {
    const res = await fetchClient(`${API_BASE}/habits/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};
