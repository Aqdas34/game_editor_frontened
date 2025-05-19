import { createStore } from 'vuex';
import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL;
console.log('API URL:', API_URL); // Log the API URL

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

export default createStore({
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    games: [],
    myGames: [],
    orders: []
  },

  getters: {
    isAuthenticated: state => !!state.token,
    isAdmin: state => state.user?.role === 'admin',
    currentUser: state => state.user,
    allGames: state => state.games,
    purchasedGames: state => state.myGames,
    userOrders: state => state.orders
  },

  mutations: {
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setGames(state, games) {
      state.games = games;
    },
    setMyGames(state, games) {
      state.myGames = games;
    },
    setOrders(state, orders) {
      state.orders = orders;
    }
  },

  actions: {
    async login({ commit }, credentials) {
      try {
        // console.log('Login attempt with credentials:', credentials);
        
        // Ensure credentials are in the correct format
        const loginData = {
          email: credentials.email,
          password: credentials.password
        };
        
        console.log('Sending login request with data:', loginData);
        console.log('API URL:', `${API_URL}/auth/login`);
        const response = await axios.post(`${API_URL}/auth/login`, loginData);
        console.log('Login response:', response.data);
        
        if (response.data.token && response.data.user) {
          // Set the token in axios defaults for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          commit('setToken', response.data.token);
          commit('setUser', response.data.user);
          return response.data;
        } else {
          console.error('Invalid response format:', response.data);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Login error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response) {
          throw new Error(error.response.data.message || 'Login failed');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        } else {
          throw new Error('Error setting up login request: ' + error.message);
        }
      }
    },

    async register({ commit }, userData) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        commit('setToken', response.data.token);
        commit('setUser', response.data.user);
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async logout({ commit }) {
      commit('clearAuth');
    },

    async fetchGames({ commit }) {
      try {
        const response = await axios.get(`${API_URL}/games`);
        commit('setGames', response.data);
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async fetchMyGames({ commit, state }) {
      try {
        const response = await axios.get(`${API_URL}/games/my-games`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setMyGames', response.data);
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async fetchOrders({ commit, state }) {
      try {
        const response = await axios.get(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setOrders', response.data);
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async createOrder({ state }, gameId) {
      try {
        const response = await axios.post(
          `${API_URL}/orders`,
          { gameId },
          { headers: { Authorization: `Bearer ${state.token}` } }
        );
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async confirmOrder({ state }, orderId) {
      try {
        const response = await axios.post(
          `${API_URL}/orders/${orderId}/confirm`,
          {},
          { headers: { Authorization: `Bearer ${state.token}` } }
        );
        return response.data;
      } catch (error) {
        throw error.response.data;
      }
    },

    async fetchUsers({ state }) {
      try {
        console.log('Fetching users with token:', state.token);
        console.log('API URL:', `${API_URL}/users`);
        
        if (!state.token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/users`, {
          headers: { 
            Authorization: `Bearer ${state.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Users API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error in fetchUsers:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        throw error.response?.data || error;
      }
    },

    async updateUserStatus({ state }, { userId, status }) {
      try {
        console.log('Updating user status:', { userId, status });
        
        if (!state.token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.put(
          `${API_URL}/users/${userId}/status`, 
          { status },
          {
            headers: { 
              Authorization: `Bearer ${state.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Update status response:', response.data);
        
        if (response.data && response.data.status) {
          return response.data;
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error updating user status:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });

        // Handle different types of errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data?.message || 'Server error occurred';
          throw new Error(errorMessage);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error('Error setting up the request: ' + error.message);
        }
      }
    },

    async createGame({ state }, formData) {
      try {
        console.log('Creating new game:', formData);
        const response = await axios.post(
          `${API_URL}/games`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${state.token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        console.log('Game created:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error creating game:', error);
        throw error.response?.data || error;
      }
    },

    async updateGame({ state }, gameData) {
      try {
        console.log('Updating game:', gameData);
        const response = await axios.put(
          `${API_URL}/games/${gameData._id}`,
          gameData,
          {
            headers: { 
              Authorization: `Bearer ${state.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Game updated:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error updating game:', error);
        throw error.response?.data || error;
      }
    },

    async deleteGame({ state }, gameId) {
      try {
        console.log('Deleting game:', gameId);
        const response = await axios.delete(
          `${API_URL}/games/${gameId}`,
          {
            headers: { 
              Authorization: `Bearer ${state.token}`
            }
          }
        );
        console.log('Game deleted:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error deleting game:', error);
        throw error.response?.data || error;
      }
    }
  }
}); 