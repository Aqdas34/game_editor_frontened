<template>
  <div :class="['home', { admin: isAdmin }]">
    <section class="hero">
      <h1>Welcome to Game Platform</h1>
      <p>Discover and play interactive games with our powerful image editor</p>
      <button @click="navigateToGames" class="btn btn-primary">Browse Games</button>
    </section>

    <section class="features">
      <div class="feature-card">
        <h3>Interactive Games</h3>
        <p>Explore our collection of engaging games with interactive elements</p>
      </div>
      <div class="feature-card">
        <h3>Image Editor</h3>
        <p>Edit and customize game content with our powerful image editor</p>
      </div>
      <div class="feature-card">
        <h3>Easy Access</h3>
        <p>Get started with free access to game previews</p>
      </div>
    </section>

    <section class="latest-games">
      <h2>Latest Games</h2>
      <div class="grid">
        <div v-for="game in latestGames" :key="game._id" class="game-card">
          <img :src="`${assetUrl}/${game.thumbnail}`" :alt="game.name" class="game-thumbnail">
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>{{ game.author }}</p>
            <button @click="viewGame(game._id)" class="btn btn-primary">View Game</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'HomeView',
  setup() {
    const store = useStore();
    const router = useRouter();
    if(localStorage.getItem('guestUserId')){
      localStorage.removeItem('guestUserId');
    }
    const latestGames = computed(() => {
      return store.getters.allGames.slice(0, 4);
    });

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const isAdmin = computed(() => store.getters.currentUser?.role === 'admin');

    const assetUrl = process.env.VUE_APP_ASSETS_URL;
    console.log('Asset URL:', assetUrl);
    const navigateToGames = () => {
      router.push('/games');
    };

    const viewGame = (gameId) => {
      router.push(`/games/${gameId}`);
    };

    onMounted(async () => {
      try {
        await store.dispatch('fetchGames');
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    });

    return {
      latestGames,
      navigateToGames,
      viewGame,
      isAuthenticated,
      assetUrl,
      isAdmin
    };
  }
};
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  left: 0;
}

.home.admin {
  left: 10%;
  width: 90%;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.latest-games {
  margin-bottom: 3rem;
}

.latest-games h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.game-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.game-card:hover {
  transform: translateY(-5px);
}

.game-thumbnail {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.game-info {
  padding: 1rem;
  text-align: center;
}

.game-info h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.game-info p {
  color: #666;
  margin-bottom: 1rem;
}
</style> 