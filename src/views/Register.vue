<template>
  <div class="register">
    <div class="register-card">
      <h2>Register</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            type="text"
            id="name"
            v-model="name"
            required
            placeholder="Enter your full name"
          >
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
            minlength="6"
          >
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Confirm your password"
            minlength="6"
          >
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <p class="login-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'RegisterView',
  setup() {
    const store = useStore();
    const router = useRouter();

    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const loading = ref(false);

    const handleSubmit = async () => {
      try {
        if (password.value !== confirmPassword.value) {
          error.value = 'Passwords do not match';
          return;
        }

        loading.value = true;
        error.value = '';
        await store.dispatch('register', {
          name: name.value,
          email: email.value,
          password: password.value,
          status: 'active'
        });
        
        // After registration, redirect to Stripe checkout
   
        const guestUserId = localStorage.getItem('guestUserId');
        if (guestUserId) {
          const lastViewedGameId = localStorage.getItem('lastViewedGameId');
          const token = store.state.token;
          if (lastViewedGameId) {
            const response = await axios.post(`${process.env.VUE_APP_API_URL}/payments/create-checkout-session`, 
              { gameId: lastViewedGameId },
              { 
                headers: { 
                  Authorization: `Bearer ${token}` 
                }
              }
            );

            window.location.href = response.data.url;
          }
        
        } else {
          router.push('/');
        }

        if (guestUserId) {
          await axios.post(`${process.env.VUE_APP_API_URL}/games/rename-folder`, {
            oldName: guestUserId,
            newName: store.getters.currentUser.id
          });
          localStorage.removeItem('guestUserId');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred during registration';
      } finally {
        loading.value = false;
      }
    };

    return {
      name,
      email,
      password,
      confirmPassword,
      error,
      loading,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-card h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
  text-align: center;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #3498db;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 