import axios from 'axios';

const backendUrl = import.meta.env.BACKEND_SERVER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: backendUrl,
  timeout: 5000, // Set your desired timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;