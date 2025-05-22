<template>
  <div class="games custom-scroll">
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
    <div v-else class="grid custom-scroll">
      <div v-for="game in filteredGames" :key="game._id" class="game-card">
        <img :src="`${ASSETS_URL}/${game.thumbnail}`" :alt="game.name" class="game-thumbnail">
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
    const ASSETS_URL = process.env.VUE_APP_ASSETS_URL || 'http://localhost:5000/uploads';

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
      filterGames,
      ASSETS_URL
    };
  }
};
</script>

<style scoped>
.games {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  height: calc(100vh - 70px);
  overflow-y: auto;
  background-color: #f8f9fa;
}

.filters {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  padding: 1.5rem;
  z-index: 100;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search {
  flex: 1;
  min-width: 200px;
}

.search input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.filter-options select {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.filter-options select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.loading,
.no-games {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem 0;
}

.game-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.game-thumbnail {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid #f0f0f0;
}

.game-info {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.game-info h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.author {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.game-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.type,
.age {
  background-color: #f8f9fa;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 500;
}

.game-actions {
  margin-top: auto;
}

.btn {
  display: inline-block;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s;
  text-align: center;
  font-weight: 500;
}

.btn:hover {
  background-color: #2980b9;
}

@media screen and (max-width: 768px) {
  .games {
    padding: 1rem;
    height: calc(100vh - 120px);
  }

  .filters {
    flex-direction: column;
    padding: 1rem;
  }

  .search,
  .filter-options {
    width: 100%;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .game-card {
    max-width: 100%;
  }
}
</style> 