const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('master_tasks_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

export const api = {
  // Auth endpoints
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(full_name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password }),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async changePassword(current_password, new_password) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ current_password, new_password }),
    });
    return handleResponse(res);
  },

  async updateProfile(full_name, avatar_url) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ full_name, avatar_url }),
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
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async updateTaskStatus(id, status) {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/tasks/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Category endpoints
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createCategory(categoryData) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(res);
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Goals endpoints
  async getGoals() {
    const res = await fetch(`${API_BASE}/goals`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createGoal(goalData) {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goalData),
    });
    return handleResponse(res);
  },

  async updateGoal(id, goalData) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(goalData),
    });
    return handleResponse(res);
  },

  async deleteGoal(id) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Courses endpoints
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createCourse(courseData) {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async updateCourse(id, courseData) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    return handleResponse(res);
  },

  async incrementCourseLesson(id) {
    const res = await fetch(`${API_BASE}/courses/${id}/increment`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteCourse(id) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
