import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

let getAuthToken = null;

export const setTokenProvider = (provider) => {
  getAuthToken = provider;
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (getAuthToken) {
    try {
      const idToken = await getAuthToken();
      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (e) {
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const postsAPI = {
  getFeed: (page = 1) => api.get(`/posts?page=${page}`),
  getPost: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  comment: (id, content) => api.post(`/posts/${id}/comment`, { content }),
  reply: (postId, commentId, content) => api.post(`/posts/${postId}/comment/${commentId}/reply`, { content }),
  share: (id, content) => api.post(`/posts/${id}/share`, { content }),
  getTrending: () => api.get('/posts/trending'),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (participantId) => api.post('/messages/conversations', { participantId }),
  getConversation: (id) => api.get(`/messages/conversations/${id}`),
  sendMessage: (conversationId, content, replyTo, attachments) => api.post(`/messages/conversations/${conversationId}/messages`, { content, replyTo, attachments }),
  uploadFiles: (conversationId, files) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post(`/messages/conversations/${conversationId}/upload`, form);
  },
  getUnreadCount: () => api.get('/messages/unread-count'),
  clearMessages: (conversationId) => api.delete(`/messages/conversations/${conversationId}/messages`),
  deleteConversation: (conversationId) => api.delete(`/messages/conversations/${conversationId}`),
  muteConversation: (conversationId) => api.post(`/messages/conversations/${conversationId}/mute`),
  deleteMessage: (conversationId, messageId, scope) => api.delete(`/messages/conversations/${conversationId}/messages/${messageId}?scope=${scope}`),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  follow: (id) => api.post(`/users/${id}/follow`),
  block: (id) => api.post(`/users/${id}/block`),
  search: (q) => api.get(`/users/search?q=${q}`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
  getSuggested: () => api.get('/users/suggested'),
  updateSettings: (data) => api.put('/users/settings', data),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export default api;
