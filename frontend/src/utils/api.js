import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true
});

export const authAPI = {
  createSession: (sessionId) => api.post('/auth/session', {}, {
    headers: { 'X-Session-ID': sessionId }
  }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const samplesAPI = {
  list: (params) => api.get('/samples', { params }),
  get: (packId) => api.get(`/samples/${packId}`),
  download: (packId) => api.get(`/samples/${packId}/download`, { responseType: 'blob' })
};

export const purchaseAPI = {
  createCheckout: (packId, originUrl) => api.post('/purchase/create-checkout', null, {
    params: { pack_id: packId, origin_url: originUrl }
  }),
  checkStatus: (sessionId) => api.get(`/purchase/status/${sessionId}`)
};

export const subscriptionAPI = {
  createCheckout: (originUrl) => api.post('/subscribe/create-checkout', null, {
    params: { origin_url: originUrl }
  }),
  checkStatus: (sessionId) => api.get(`/subscribe/status/${sessionId}`),
  getStatus: () => api.get('/subscribe/status')
};

export const favoritesAPI = {
  list: () => api.get('/favorites'),
  add: (packId) => api.post(`/favorites/${packId}`),
  remove: (packId) => api.delete(`/favorites/${packId}`)
};

export const collectionsAPI = {
  list: () => api.get('/collections'),
  create: (formData) => api.post('/collections', formData),
  addPack: (collectionId, packId) => api.post(`/collections/${collectionId}/packs/${packId}`),
  removePack: (collectionId, packId) => api.delete(`/collections/${collectionId}/packs/${packId}`)
};

export const creatorAPI = {
  apply: () => api.post('/creator/apply'),
  uploadPack: (formData) => api.post('/creator/packs', formData),
  listPacks: () => api.get('/creator/packs'),
  getEarnings: () => api.get('/creator/earnings'),
  updatePayoutSettings: (formData) => api.post('/creator/payout-settings', formData)
};

export const adminAPI = {
  listCreators: () => api.get('/admin/creators'),
  approveCreator: (creatorId) => api.post(`/admin/creators/${creatorId}/approve`),
  uploadPack: (formData) => api.post('/admin/packs', formData),
  listPacks: () => api.get('/admin/packs'),
  updatePack: (packId, formData) => api.put(`/admin/packs/${packId}`, formData),
  deletePack: (packId) => api.delete(`/admin/packs/${packId}`),
  markFree: (packId, formData) => api.post(`/admin/packs/${packId}/mark-free`, formData),
  markFeatured: (packId, formData) => api.post(`/admin/packs/${packId}/mark-featured`, formData),
  markSyncReady: (packId, formData) => api.post(`/admin/packs/${packId}/mark-sync-ready`, formData),
  updateMetadata: (packId, formData) => api.post(`/admin/packs/${packId}/update-metadata`, formData),
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  promoteUser: (userId) => api.post(`/admin/users/${userId}/promote`),
  inviteCreator: (formData) => api.post('/admin/invite-creator', formData),
  listInvitations: () => api.get('/admin/invitations')
};