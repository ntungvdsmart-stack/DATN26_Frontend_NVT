import axiosClient from './axiosClient';

const configApi = {
  // Lấy danh sách cấu hình hệ thống
  getSettings: () => axiosClient.get('/config'),
  
  // Cập nhật cấu hình hệ thống
  updateSettings: (settingsData) => axiosClient.put('/config', settingsData),
};

export default configApi;
