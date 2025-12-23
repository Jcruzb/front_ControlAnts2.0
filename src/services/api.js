import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      console.error('API error:', error.response.status, error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
