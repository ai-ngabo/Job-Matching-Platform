import api from './api';

export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async uploadCV(file) {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await api.post('/upload/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async uploadIDDocument(file, idType = 'national_id') {
    const formData = new FormData();
    formData.append('idDocument', file);
    formData.append('idType', idType);

    const response = await api.post('/upload/id-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async uploadBusinessCertificate(file) {
    const formData = new FormData();
    formData.append('certificate', file);

    const response = await api.post('/upload/business-certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteCV() {
    const response = await api.delete('/upload/cv');
    return response.data;
  },

  async deleteIDDocument() {
    const response = await api.delete('/upload/id-document');
    return response.data;
  },

  async deleteBusinessCertificate() {
    const response = await api.delete('/upload/business-certificate');
    return response.data;
  }
};
