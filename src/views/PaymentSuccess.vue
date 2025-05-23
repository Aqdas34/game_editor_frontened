<template>
  <div class="payment-success">
    <div class="success-card">
      <div class="success-icon">✓</div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase. You now have full access to all images in this game.</p>
      <p class="session-id" v-if="sessionId">Session ID: {{ sessionId }}</p>
      
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <p>Please contact support with your session ID.</p>
      </div>
      
      <div class="actions">
        <router-link :to="`/games/${gameId}`" class="btn btn-primary">Return to Game</router-link>
        <router-link to="/games" class="btn btn-secondary">All Games</router-link>
        <router-link to="/my-orders" class="btn btn-secondary">View Orders</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'PaymentSuccessView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const sessionId = ref(route.query.session_id || '');
    const gameId = ref('');
    const orderId = ref('');
    const API_URL = process.env.VUE_APP_API_URL;
    const error = ref('');
    
    onMounted(async () => {
      if (!sessionId.value) {
        router.push('/games');
        return;
      }
      
      try {
        // Verify the session with your backend
        const response = await axios.get(`${API_URL}/api/payments/verify-session/${sessionId.value}`);
        gameId.value = response.data.gameId;
        orderId.value = response.data.orderId;
        
        // Confirm the order after successful payment
        if (orderId.value) {
          await confirmOrder(orderId.value);
        
        } else {
          error.value = 'Order ID not found in session data';
          console.error('Order ID not found in session data');
        }
      } catch (error) {
        console.error('Error verifying payment session:', error);
        // Even if verification fails, we can still show the success page
        // Try to get the game ID from localStorage as fallback
        gameId.value = localStorage.getItem('lastViewedGameId') || '';
      }
    });
    
    const confirmOrder = async (orderId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          error.value = 'Authentication token not found';
          return;
        }
        
        await axios.post(`${API_URL}/api/orders/${orderId}/confirm`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Order confirmed successfully');
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to confirm order';
        console.error('Error confirming order:', err);
      }
    };
    
    return {
      sessionId,
      gameId,
      orderId,
      error
    };
  }
};
</script>

<style scoped>
.payment-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
  background-color: #f8f9fa;
}

.success-card {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.success-icon {
  background-color: #2ecc71;
  color: white;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

p {
  color: #636e72;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.session-id {
  font-size: 0.8rem;
  color: #95a5a6;
  margin-bottom: 2rem;
  word-break: break-all;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.error-message {
  background-color: #ffe4e4;
  border-left: 4px solid #ff5252;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.error-message p {
  color: #c62828;
  margin: 0.5rem 0;
}
</style> 