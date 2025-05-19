<template>
  <div class="games">
    <div class="filters">
      <div class="search">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search games..."
          @input="filterGames"
        >
      </div>
      <div class="filter-options">
        <select v-model="typeFilter" @change="filterGames">
          <option value="">All Types</option>
          <option value="puzzle">Puzzle</option>
          <option value="coloring">Coloring</option>
          <option value="matching">Matching</option>
          <option value="other">Other</option>
        </select>
        <select v-model="ageFilter" @change="filterGames">
          <option value="">All Ages</option>
          <option value="3-5">3-5 years</option>
          <option value="6-8">6-8 years</option>
          <option value="9-12">9-12 years</option>
          <option value="13+">13+ years</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      Loading games...
    </div>
    <div v-else-if="filteredGames.length === 0" class="no-games">
      No games found matching your criteria.
    </div>
    <div v-else class="grid">
      <div v-for="game in filteredGames" :key="game._id" class="game-card">
        <img :src="game.thumbnail" :alt="game.name" class="game-thumbnail">
        <div class="game-info">
          <h3>{{ game.name }}</h3>
          <p class="author">By {{ game.author }}</p>
          <div class="game-meta">
            <span class="type">{{ game.type }}</span>
            <span class="age">{{ game.ageGroup }}</span>
          </div>
          <div class="game-actions">
            <router-link :to="`/games/${game._id}`" class="btn btn-primary">
              View Game
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'GamesView',
  setup() {
    const store = useStore();
    const searchQuery = ref('');
    const typeFilter = ref('');
    const ageFilter = ref('');
    const loading = ref(true);

    const allGames = computed(() => store.getters.allGames);

    const filteredGames = computed(() => {
      return allGames.value.filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            game.author.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesType = !typeFilter.value || game.type === typeFilter.value;
        const matchesAge = !ageFilter.value || game.ageGroup === ageFilter.value;
        return matchesSearch && matchesType && matchesAge;
      });
    });

    const filterGames = () => {
      // This function is called when filters change
      // The filtering is handled by the computed property
    };

    onMounted(async () => {
      try {
        await store.dispatch('fetchGames');
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        loading.value = false;
      }
    });

    return {
      searchQuery,
      typeFilter,
      ageFilter,
      loading,
      filteredGames,
      filterGames
    };
  }
};
</script>

<style scoped>
.games {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.filters {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search {
  flex: 1;
  min-width: 200px;
}

.search input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.filter-options select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
}

.loading,
.no-games {
  text-align: center;
  padding: 2rem;
  color: #666;
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
}

.game-info h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.author {
  color: #666;
  margin-bottom: 0.5rem;
}

.game-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.type,
.age {
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
}

.game-actions {
  text-align: center;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .search,
  .filter-options {
    width: 100%;
  }

  .filter-options {
    flex-direction: column;
  }
}
</style> 