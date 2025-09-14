import axios from 'axios';

const http = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

http.interceptors.request.use(
  (config) => {
    // Add authorization token to headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default http;
