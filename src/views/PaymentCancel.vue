<template>
  <div class="payment-cancel">
    <div class="cancel-card">
      <div class="cancel-icon">✕</div>
      <h1>Payment Cancelled</h1>
      <p>Your payment was cancelled. No charges were made to your account.</p>
      <div class="actions">
        <router-link :to="`/games/${gameId}`" class="btn btn-primary">Return to Game</router-link>
        <router-link to="/games" class="btn btn-secondary">Browse Games</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'PaymentCancelView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const gameId = ref('');
    
    onMounted(() => {
      // Try to get the game ID from route params or localStorage
      const urlGameId = route.query.game_id;
      if (urlGameId) {
        gameId.value = urlGameId;
      } else {
        // Check localStorage for the last viewed game
        gameId.value = localStorage.getItem('lastViewedGameId') || '';
        
        // If we still don't have a game ID, redirect to games page
        if (!gameId.value) {
          router.push('/games');
        }
      }
    });
    
    return {
      gameId
    };
  }
};
</script>

<style scoped>
.payment-cancel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
  background-color: #f8f9fa;
}

.cancel-card {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.cancel-icon {
  background-color: #e74c3c;
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
</style> 