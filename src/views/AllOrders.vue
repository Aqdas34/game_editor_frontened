<template>
  <div class="all-orders">
    <h1>All Orders</h1>
    <div v-if="loading" class="loading">Loading orders...</div>
    <div v-else>
      <div v-if="orders.length === 0" class="no-orders">No orders found.</div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order._id" class="order-item">
          <h3>Order #{{ order._id }}</h3>
          <p>User: {{ order.user.name }}</p>
          <p>Status: {{ order.status }}</p>
          <p>Total: ${{ order.amount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'AllOrders',
  setup() {
    const store = useStore();
    const router = useRouter();
    const orders = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchOrders = async () => {
      try {
        const response = await store.dispatch('fetchAllOrders');
        console.log('Dispatch response:', response);
        orders.value = response ? [...response] : [];
        console.log('Orders array updated:', orders.value);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        error.value = 'Failed to load orders. Please try again later.';
      } finally {
        loading.value = false;
        console.log('Loading complete:', loading.value);
      }
    };

    const viewOrder = (orderId) => {
      router.push({ name: 'OrderDetail', params: { id: orderId } });
    };

    onMounted(() => {
      console.log('Component mounted');
      fetchOrders();
    });

    return {
      orders,
      loading,
      error,
      viewOrder
    };
  }
};
</script>

<style scoped>
.all-orders {
  padding: 2rem;
  width: 85%;
  left: 15%;
  position: relative; 
}

.loading {
  font-size: 1.2rem;
  color: #888;
}

.no-orders {
  font-size: 1.2rem;
  color: #888;
}

.orders-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.order-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.order-item h3 {
  margin-bottom: 0.5rem;
}

.order-item p {
  margin: 0.5rem 0;
}

.order-item button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #3498db;
  color: white;
  cursor: pointer;
}

.order-item button:hover {
  background-color: #2980b9;
}
</style> 