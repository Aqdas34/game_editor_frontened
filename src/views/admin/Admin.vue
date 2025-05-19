<template>
  <div class="admin">
    <div class="admin-sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <router-link to="/admin/games" class="nav-item">
          <span class="icon">🎮</span>
          Games
        </router-link>
        <router-link to="/admin/users" class="nav-item">
          <span class="icon">👥</span>
          Users
        </router-link>
        <router-link to="/admin/orders" class="nav-item">
          <span class="icon">📦</span>
          Orders
        </router-link>
      </nav>
    </div>
    
    <div class="admin-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboardView'
};
</script>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
}

.admin-sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 2rem 0;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
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

.admin-content {
  flex: 1;
  padding: 2rem;
  background-color: #f8f9fa;
  margin-left: 250px; /* Same as sidebar width */
  min-height: 100vh;
  width: calc(100% - 250px);
}
</style> 