import axiosClient from './axiosClient';

const supportApi = {
  getSessions: () => axiosClient.get('/support/sessions'),
  getMessages: (sessionId, page = 1) => axiosClient.get(`/support/sessions/${sessionId}/messages`, { params: { page } }),
  sendMessage: (sessionId, data) => axiosClient.post(`/support/sessions/${sessionId}/messages`, data),
  updateStatus: (sessionId, status) => axiosClient.patch(`/support/sessions/${sessionId}/status`, { status }),
  getBranchSuggestions: (sessionId) => axiosClient.get(`/support/sessions/${sessionId}/branch-suggestions`),
  assignSession: (sessionId, data) => axiosClient.post(`/support/sessions/${sessionId}/assign`, data),
};

export default supportApi;
