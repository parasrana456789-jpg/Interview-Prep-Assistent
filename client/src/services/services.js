import api from './api.js';

const d = (p) => p.then((r) => r.data);

export const authService = {
  register: (name, email, password) => d(api.post('/auth/register', { name, email, password })),
  login: (email, password) => d(api.post('/auth/login', { email, password })),
  me: () => d(api.get('/auth/me')),
  logout: () => d(api.post('/auth/logout')),
  forgot: (email) => d(api.post('/auth/forgot-password', { email })),
  reset: (token, password) => d(api.post(`/auth/reset-password/${token}`, { password })),
};

export const profileService = {
  get: () => d(api.get('/profile')),
  update: (body) => d(api.put('/profile', body)),
  uploadAvatar: (blob) => { const f = new FormData(); f.append('avatar', blob, 'avatar.jpg'); return d(api.post('/profile/avatar', f)); },
  removeAvatar: () => d(api.delete('/profile/avatar')),
};

export const aptitudeService = {
  generate: (body) => d(api.post('/aptitude/generate', body)),
  submit: (body) => d(api.post('/aptitude/submit', body)),
  history: () => d(api.get('/aptitude/history')),
};

export const codingService = {
  generate: (body) => d(api.post('/coding/generate', body)),
  run: (body) => d(api.post('/coding/run', body)),
  analyze: (body) => d(api.post('/coding/analyze', body)),
  submit: (body) => d(api.post('/coding/submit', body)),
  history: () => d(api.get('/coding/history')),
};

export const interviewService = {
  start: (body) => d(api.post('/interview/start', body)),
  submit: (body) => d(api.post('/interview/submit', body)),
  history: () => d(api.get('/interview/history')),
  get: (id) => d(api.get(`/interview/${id}`)),
};

export const questionService = {
  list: (params) => d(api.get('/questions', { params })),
};

export const resumeService = {
  get: () => d(api.get('/resume')),
  fromProfile: () => d(api.get('/resume/from-profile')),
  save: (body) => d(api.put('/resume', body)),
  aiSummary: (body) => d(api.post('/resume/ai-summary', body)),
  pdf: async () => (await api.get('/resume/pdf', { responseType: 'blob' })).data,
};

export const analyticsService = {
  dashboard: () => d(api.get('/analytics/dashboard')),
  progress: () => d(api.get('/analytics/progress')),
};

export const adminService = {
  overview: () => d(api.get('/admin/overview')),
  users: (params) => d(api.get('/admin/users', { params })),
  updateUser: (id, body) => d(api.patch(`/admin/users/${id}`, body)),
  deleteUser: (id) => d(api.delete(`/admin/users/${id}`)),
  reports: () => d(api.get('/admin/reports')),
};
