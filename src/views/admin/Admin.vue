<template>
  <div class="admin">

    
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
  flex-direction: column;
  width: 85%;
  left: 15%;
  position: relative;
}

.icon {
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

</style>