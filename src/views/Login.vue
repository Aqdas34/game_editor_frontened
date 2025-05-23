<template>
  <div class="login">
    <div class="login-card">
      <h2>Login</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
            :class="{ 'error-input': error }"
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
            :class="{ 'error-input': error }"
          >
        </div>
        <div v-if="error" class="error-container">
          <div class="error-icon">!</div>
          <div class="error-message">{{ error }}</div>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    const handleSubmit = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        if (!email.value || !password.value) {
          error.value = 'Please fill in all fields';
          return;
        }

        // Ensure data is in the correct format
        const loginData = {
          email: email.value.trim(),
          password: password.value
        };

        console.log('Submitting login form with data:', loginData);
        const response = await store.dispatch('login', loginData);
        console.log('Login response received:', response);
        
        if (response && response.user) {
          console.log('Login successful, user role:', response.user.role);
          console.log('Redirecting to:', route.query.redirect || '/');
          const redirectPath = route.query.redirect || '/';
          await router.push(redirectPath);

          const guestUserId = localStorage.getItem('guestUserId');
          if (guestUserId) {
            await axios.post(`${process.env.VUE_APP_API_URL}/games/rename-folder`, {
              oldName: guestUserId,
              newName: response.user.id
            });
            localStorage.removeItem('guestUserId');
          }
        } else {
          throw new Error('Invalid login response');
        }
      } catch (err) {
        console.error('Login error in component:', err);
        // Format error message to be more user-friendly
        if (err.message.includes('Invalid credentials')) {
          error.value = 'Invalid email or password';
        } else if (err.message.includes('pending approval')) {
          error.value = 'Your account is pending approval. Please contact an administrator.';
        } else if (err.message.includes('No response')) {
          error.value = 'Unable to connect to the server. Please check your internet connection.';
        } else {
          error.value = err.message || 'An error occurred during login';
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      error,
      loading,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
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
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.error-input {
  border-color: #e74c3c !important;
  background-color: #fff5f5;
}

.error-container {
  display: flex;
  align-items: center;
  background-color: #fff5f5;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.error-icon {
  background-color: #e74c3c;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  line-height: 1.4;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style> 