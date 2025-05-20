<template>
  <div class="admin-users">
    <h1>User Management</h1>
    
    <div class="filters">
      <select v-model="statusFilter" class="filter-select">
        <option value="all">All Users</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>

    <!-- Debug info -->
    <div class="debug-info">
      <p>Loading: {{ loading }}</p>
      <p>Error: {{ error }}</p>
      <p>Total Users: {{ users.length }}</p>
      <p>Filtered Users: {{ filteredUsers.length }}</p>
    </div>

    <div v-if="loading" class="loading">
      Loading users...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="filteredUsers.length === 0" class="no-users">
      No users found.
    </div>
    
    <div v-else class="users-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user._id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <span :class="['status-badge', user.status]">
                {{ user.status }}
              </span>
            </td>
            <td class="actions">
              <button 
                v-if="user.status === 'pending'"
                @click="approveUser(user._id)"
                class="btn btn-success"
                :disabled="loading"
              >
                Approve
              </button>
              <button 
                v-if="user.status === 'active'"
                @click="suspendUser(user._id)"
                class="btn btn-warning"
                :disabled="loading"
              >
                Suspend
              </button>
              <button 
                v-if="user.status === 'suspended'"
                @click="activateUser(user._id)"
                class="btn btn-info"
                :disabled="loading"
              >
                Activate
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AdminUsersView',
  
  setup() {
    const store = useStore();
    const users = ref([]);
    const loading = ref(false);
    const error = ref('');
    const statusFilter = ref('all');

    console.log('AdminUsersView setup - Store state:', {
      isAuthenticated: store.getters.isAuthenticated,
      isAdmin: store.getters.isAdmin,
      currentUser: store.getters.currentUser
    });

    const filteredUsers = computed(() => {
      console.log('Filtering users:', {
        totalUsers: users.value.length,
        filter: statusFilter.value,
        users: users.value
      });
      if (statusFilter.value === 'all') {
        return users.value;
      }
      return users.value.filter(user => user.status === statusFilter.value);
    });

    const fetchUsers = async () => {
      try {
        loading.value = true;
        error.value = '';
        console.log('Starting to fetch users...');
        console.log('Current auth token:', store.state.token);
        
        const response = await store.dispatch('fetchUsers');
        console.log('Users fetched successfully:', response);
        
        if (Array.isArray(response)) {
          users.value = response;
          console.log('Users array updated:', users.value);
        } else {
          console.error('Invalid response format:', response);
          error.value = 'Invalid response format from server';
        }
      } catch (err) {
        console.error('Error in fetchUsers:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack
        });
        error.value = err.response?.data?.message || err.message || 'Failed to fetch users';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      console.log('AdminUsersView mounted');
      fetchUsers();
    });

    const approveUser = async (userId) => {
      try {
        loading.value = true;
        error.value = '';
        await store.dispatch('updateUserStatus', { userId, status: 'active' });
        await fetchUsers();
      } catch (err) {
        error.value = err.message || 'Failed to approve user';
      } finally {
        loading.value = false;
      }
    };

    const suspendUser = async (userId) => {
      try {
        loading.value = true;
        error.value = '';
        await store.dispatch('updateUserStatus', { userId, status: 'suspended' });
        await fetchUsers();
      } catch (err) {
        error.value = err.message || 'Failed to suspend user';
      } finally {
        loading.value = false;
      }
    };

    const activateUser = async (userId) => {
      try {
        loading.value = true;
        error.value = '';
        console.log('Activating user:', userId);
        
        const response = await store.dispatch('updateUserStatus', { 
          userId, 
          status: 'active' 
        });
        
        console.log('Activation response:', response);
        
        if (response && response.status === 'active') {
          // Successfully activated
          await fetchUsers(); // Refresh the user list
        } else {
          console.error('Invalid activation response:', response);
          throw new Error('Failed to activate user: Invalid response');
        }
      } catch (err) {
        console.error('Error activating user:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack
        });

        // Set a user-friendly error message
        if (err.message.includes('Server error')) {
          error.value = 'Unable to activate user. Please try again later.';
        } else if (err.message.includes('No response')) {
          error.value = 'Unable to connect to the server. Please check your connection.';
        } else {
          error.value = err.message || 'Failed to activate user';
        }

        // Refresh the user list anyway since the server might have updated
        await fetchUsers();
      } finally {
        loading.value = false;
      }
    };

    return {
      users,
      loading,
      error,
      statusFilter,
      filteredUsers,
      approveUser,
      suspendUser,
      activateUser
    };
  }
};
</script>

<style scoped>
.admin-users {
  padding: 2rem;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-bottom: 1.5rem;
}

.filters {
  margin-bottom: 2rem;
  position: sticky;
  top: 0;
  background-color: white;
  padding: 1rem 0;
  z-index: 2;
}

.debug-info {
  background-color: #f8f9fa;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-family: monospace;
  position: sticky;
  top: 80px; /* Adjust based on filters height */
  z-index: 1;
}

.debug-info p {
  margin: 0.5rem 0;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.users-table {
  width: 100%;
  overflow-x: auto;
  max-height: 600px; /* Fixed height for the table container */
  overflow-y: auto; /* Enable vertical scrolling */
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

thead {
  position: sticky; /* Make the header sticky */
  top: 0;
  background-color: #f8f9fa;
  z-index: 1;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: #ffeeba;
  color: #856404;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.suspended {
  background-color: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #000;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.loading, .error, .no-users {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
}
</style> 