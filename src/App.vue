<template>
  <div class="app-wrapper">
    <div v-if="isAdmin" class="admin-sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <router-link to="/" class="nav-item">Home</router-link>
        <router-link to="/admin/games" class="nav-item">Games</router-link>
        <router-link to="/admin/users" class="nav-item">Users</router-link>
        <router-link to="/all-orders" class="nav-item">All Orders</router-link>
        <button @click="logout" class="nav-item logout">Logout</button>
      </nav>
    </div>
    <nav v-else class="navbar">
      <div class="navbar-brand">
        <router-link to="/" class="logo">Game Platform</router-link>
      </div>
      <div class="navbar-menu">
        <template v-if="isAuthenticated">
          <router-link to="/" class="nav-item">Home</router-link>
          <router-link to="/games" class="nav-item">Games</router-link>
          <router-link to="/my-orders" class="nav-item">My Orders</router-link>
          <button @click="logout" class="nav-item logout">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-item">Login</router-link>
          <router-link to="/register" class="nav-item">Register</router-link>
        </template>
      </div>
    </nav>

    <div class="content-wrapper">
      <main class="main-content">
        <router-view></router-view>
      </main>

      <footer class="footer">
        <p>&copy; 2024 Game Platform. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const store = useStore();
    const router = useRouter();

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const isAdmin = computed(() => store.getters.isAdmin);

    const logout = async () => {
      await store.dispatch('logout');
      router.push('/login');
    };

    return {
      isAuthenticated,
      isAdmin,
      logout
    };
  }
};
</script>

<style>
/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Base styles */
html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  position: relative;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 12px;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: #2c3e50;
  border-radius: 10px;
  border: 2px solid #f1f1f1;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #34495e;
  cursor: pointer;
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: #2c3e50 #f1f1f1;
}

/* App wrapper */
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Navbar */
.navbar {
  background-color: #2c3e50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.navbar-brand .logo {
  color: white;
  font-size: 1.5rem;
  text-decoration: none;
  font-weight: bold;
}

.navbar-menu {
  display: flex;
  gap: 1rem;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: #34495e;
}

.nav-item.logout {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

/* Content wrapper */
.content-wrapper {
  flex: 1;
  margin-top: 70px; /* Height of navbar */
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
}

/* Main content */
.main-content {
  flex: 1;
  padding: 2rem;

  margin: 0 auto;
  width: 100%;
}

/* Footer */
.footer {
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

/* Responsive styles */
@media screen and (max-width: 768px) {
  .navbar {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .navbar-menu {
    flex-direction: column;
    width: 100%;
    text-align: center;
  }

  .nav-item {
    width: 100%;
    padding: 0.75rem;
  }

  .content-wrapper {
    margin-top: 120px; /* Adjusted for mobile navbar height */
  }

  .main-content {
    padding: 1rem;
  }
}

/* Utility classes */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* Admin sidebar styles */
.admin-sidebar {
  width: 15%;
  background-color: #2c3e50;
  color: white;
  padding: 2rem 0;
  height: 100%;
  position: fixed;
  left: 0;

  z-index: 1000;
}

.admin-sidebar h2 {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #ecf0f1;
  text-decoration: none;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: #34495e;
}

.nav-item.router-link-active {
  background-color: #3498db;
  color: white;
}

.icon {
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

/* Responsive styles for admin sidebar */
@media screen and (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    height: 100%;
    position: relative;
    top: 0;
  }
}
</style>
