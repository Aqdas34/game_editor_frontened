<template>
  <div class="my-orders">
    <div class="header-container">
      <h1>My Orders</h1>
      <button @click="fetchOrders" class="refresh-btn" :disabled="loading">
        <span v-if="!loading">Refresh</span>
        <span v-else>Loading...</span>
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      <p>Loading your orders...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchOrders" class="btn btn-primary">Try Again</button>
    </div>
    
    <div v-else-if="orders.length === 0" class="no-orders">
      <p>You haven't purchased any games yet.</p>
      <router-link to="/games" class="btn btn-primary">Browse Games</router-link>
    </div>
    
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="order-header">
          <h3>Order #{{ order._id.substring(0, 8) }}</h3>
          <span class="order-date">{{ formatDate(order.createdAt) }}</span>
        </div>
        
        <div class="order-details">
          <div class="game-info" v-if="order.game">
            <img 
              v-if="order.game.thumbnail" 
              :src="order.game.thumbnail.startsWith('http') ? order.game.thumbnail : `${ASSETS_URL}/${order.game.thumbnail}`" 
              :alt="order.game.name" 
              class="game-thumbnail"
            >
            <div class="game-details">
              <h4>{{ order.game ? order.game.name : 'Game not available' }}</h4>
              <p v-if="order.game && order.game.author">By {{ order.game.author }}</p>
            </div>
          </div>
          <div class="game-info" v-else>
            <div class="game-details">
              <h4>Game no longer available</h4>
            </div>
          </div>
          
          <div class="order-info">
            <p class="price">${{ (order.amount).toFixed(2) }}</p>
            <p class="status" :class="order.status">{{ capitalizeFirstLetter(order.status) }}</p>
            
            <div class="order-actions">
              <a v-if="order.invoiceUrl" :href="order.invoiceUrl" target="_blank" class="btn btn-secondary">View Invoice</a>
              <router-link v-if="order.game && order.game._id" :to="`/games/${order.game._id}`" class="btn btn-primary">Play Game</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'MyOrdersView',
  setup() {
    const store = useStore();
    const orders = ref([]);
    const loading = ref(true);
    const error = ref('');
    const API_URL = process.env.VUE_APP_API_URL;
    const ASSETS_URL = process.env.VUE_APP_ASSETS_URL;

    const fetchOrders = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        // Get token from store or localStorage
        const token = store.getters.token || localStorage.getItem('token');
        if (!token) {
          throw new Error('You must be logged in to view your orders');
        }
        
        // Use the correct endpoint without the /api prefix
        const response = await axios.get(`${API_URL}/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Orders fetched:', response.data);
        orders.value = response.data;
      } catch (err) {
        console.error('Error fetching orders:', err);
        error.value = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load your orders';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    onMounted(() => {
      fetchOrders();
    });

    return {
      orders,
      loading,
      error,
      formatDate,
      capitalizeFirstLetter,
      fetchOrders,
      ASSETS_URL
    };
  }
};
</script>

<style scoped>
.my-orders {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.refresh-btn {
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #dee2e6;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

h1 {
  margin-bottom: 0;
  color: #2c3e50;
}

.loading, .error-message, .no-orders {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-message p {
  margin-bottom: 1rem;
  color: #dc3545;
}

.no-orders .btn, .error-message .btn {
  margin-top: 1rem;
  display: inline-block;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-header {
  background-color: #f8f9fa;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
}

.order-header h3 {
  margin: 0;
  color: #2c3e50;
}

.order-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.order-details {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.game-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.game-details h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.game-details p {
  margin: 0;
  color: #6c757d;
}

.order-info {
  text-align: right;
  min-width: 150px;
}

.price {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
}

.status.pending {
  background-color: #ffeeba;
  color: #856404;
}

.status.confirmed {
  background-color: #d4edda;
  color: #155724;
}

.status.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #e9ecef;
  color: #495057;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .order-details {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .order-info {
    text-align: left;
    width: 100%;
    margin-top: 1rem;
  }
  
  .order-actions {
    justify-content: flex-start;
  }
}
</style> 