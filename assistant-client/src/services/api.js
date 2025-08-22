import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api/v1', // This will use the proxy set up in vite.config.js
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// API functions
export const assistantService = {
  // Send a message to the assistant
  sendMessage: async (message) => {
    try {
      const response = await api.post('/assistant', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Get conversation history
  getHistory: async () => {
    try {
      const response = await api.get('/assistant/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }
};

export default api;
