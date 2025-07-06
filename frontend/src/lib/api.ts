import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.config.url !== '/api/login'
    ) {
      localStorage.removeItem('authToken');
      window.location.href = '/login'; 
      alert('Your session has expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);