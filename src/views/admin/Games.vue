<template>
  <div class="admin-games">
    <h1>Game Management</h1>

    <!-- Add Game Form -->
    <div class="add-game-form">
      <h2>Add New Game</h2>
      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="name">Game Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="gameData.name" 
            required
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="author">Author</label>
          <input 
            type="text" 
            id="author" 
            v-model="gameData.author" 
            required
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="type">Game Type</label>
          <select 
            id="type" 
            v-model="gameData.type" 
            required
            class="form-control"
          >
            <option value="">Select Type</option>
            <option value="puzzle">Puzzle</option>
            <option value="action">Action</option>
            <option value="strategy">Strategy</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ageGroup">Age Group</label>
          <select 
            id="ageGroup" 
            v-model="gameData.ageGroup" 
            required
            class="form-control"
          >
            <option value="">Select Age Group</option>
            <option value="3-6">3-6 years</option>
            <option value="7-12">7-12 years</option>
            <option value="13-17">13-17 years</option>
            <option value="18+">18+ years</option>
          </select>
        </div>

        <div class="form-group">
          <label for="thumbnail">Thumbnail Image</label>
          <input 
            type="file" 
            id="thumbnail" 
            @change="handleThumbnailChange" 
            accept="image/jpeg,image/png"
            required
            class="form-control"
          >
          <small class="form-text">Only JPEG/PNG files up to 5MB</small>
        </div>

        <div class="form-group">
          <label for="images">Game Images</label>
          <input 
            type="file" 
            id="images" 
            @change="handleImagesChange" 
            accept="image/jpeg,image/png"
            multiple
            required
            class="form-control"
          >
          <small class="form-text">Upload up to 10 JPEG/PNG images</small>
        </div>

        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Saving Game...' : 'Save Game' }}
        </button>
      </form>
    </div>

    <!-- Games List -->
    <div class="games-list">
      <h2>Games List</h2>
      
      <div v-if="loading" class="loading">
        Loading games...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="games.length === 0" class="no-games">
        No games found.
      </div>
      
      <div v-else class="games-grid">
        <div v-for="game in games" :key="game._id" class="game-card">
          <img :src="`${ASSETS_URL}/${game.thumbnail}`" :alt="game.name" class="game-thumbnail">
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p><strong>SKU:</strong> {{ game.sku }}</p>
            <p><strong>Author:</strong> {{ game.author }}</p>
            <p><strong>Type:</strong> {{ game.type }}</p>
            <p><strong>Age Group:</strong> {{ game.ageGroup }}</p>
            <div class="game-actions">
              <button 
                @click="editGame(game)" 
                class="btn btn-info"
              >
                Edit
              </button>
              <button 
                @click="deleteGame(game._id)" 
                class="btn btn-danger"
                :disabled="loading"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Game Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h2>Edit Game</h2>
        <form @submit.prevent="handleEditSubmit" class="form">
          <div class="form-group">
            <label for="edit-name">Game Name</label>
            <input 
              type="text" 
              id="edit-name" 
              v-model="editData.name" 
              required
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="edit-author">Author</label>
            <input 
              type="text" 
              id="edit-author" 
              v-model="editData.author" 
              required
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="edit-type">Game Type</label>
            <select 
              id="edit-type" 
              v-model="editData.type" 
              required
              class="form-control"
            >
              <option value="puzzle">Puzzle</option>
              <option value="action">Action</option>
              <option value="strategy">Strategy</option>
              <option value="educational">Educational</option>
            </select>
          </div>

          <div class="form-group">
            <label for="edit-ageGroup">Age Group</label>
            <select 
              id="edit-ageGroup" 
              v-model="editData.ageGroup" 
              required
              class="form-control"
            >
              <option value="3-6">3-6 years</option>
              <option value="7-12">7-12 years</option>
              <option value="13-17">13-17 years</option>
              <option value="18+">18+ years</option>
            </select>
          </div>

          <div class="form-group">
            <label for="edit-thumbnail">Update Thumbnail</label>
            <input 
              type="file" 
              id="edit-thumbnail" 
              @change="handleEditThumbnailChange" 
              accept="image/jpeg,image/png"
              class="form-control"
            >
            <small class="form-text">Leave empty to keep current thumbnail</small>
            <div v-if="editData.thumbnail" class="current-thumbnail">
              <p>Current Thumbnail:</p>
              <img :src="`${ASSETS_URL}/${editData.thumbnail}`" alt="Current thumbnail" class="thumbnail-preview">
            </div>
          </div>

          <div class="form-group">
            <label for="edit-images">Update Game Images</label>
            <input 
              type="file" 
              id="edit-images" 
              @change="handleEditImagesChange" 
              accept="image/jpeg,image/png"
              multiple
              class="form-control"
            >
            <small class="form-text">Leave empty to keep current images</small>
            <div v-if="editData.images && editData.images.length > 0" class="current-images">
              <p>Current Images:</p>
              <div class="images-grid">
                <div v-for="(image, index) in editData.images" :key="index" class="image-preview">
                  <img :src="`${ASSETS_URL}/${image}`" :alt="`Game image ${index + 1}`">
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <button 
              type="button" 
              @click="showEditModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AdminGamesView',
  
  setup() {
    const store = useStore();
    const games = ref([]);
    const loading = ref(false);
    const error = ref('');
    const showEditModal = ref(false);
    const API_URL = process.env.VUE_APP_API_URL;
    const ASSETS_URL = 'https://game-editor-backened.onrender.com/uploads';
    const gameData = ref({
      name: '',
      author: '',
      type: '',
      ageGroup: '',
      thumbnail: null,
      images: []
    });

    const editData = ref({
      _id: '',
      name: '',
      author: '',
      type: '',
      ageGroup: '',
      thumbnail: null,
      images: [],
      newThumbnail: null,
      newImages: []
    });

    const fetchGames = async () => {
      try {
        loading.value = true;
        error.value = '';
        const response = await store.dispatch('fetchGames');
        games.value = response;
      } catch (err) {
        error.value = err.message || 'Failed to fetch games';
      } finally {
        loading.value = false;
      }
    };

    const handleThumbnailChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        console.log('Selected thumbnail:', file.name, file.type, file.size);
        gameData.value.thumbnail = file;
      }
    };

    const handleImagesChange = (event) => {
      const files = Array.from(event.target.files);
      console.log('Selected images:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      
      if (files.length > 10) {
        error.value = 'Maximum 10 images allowed';
        return;
      }
      gameData.value.images = files;
    };

    const handleSubmit = async () => {
      try {
        loading.value = true;
        error.value = '';

        // Validate files first
        if (!gameData.value.thumbnail) {
          error.value = 'Please select a thumbnail image';
          loading.value = false;
          return;
        }
        
        if (!gameData.value.images || gameData.value.images.length === 0) {
          error.value = 'Please select at least one game image';
          loading.value = false;
          return;
        }

        const formData = new FormData();
        
        // Add text fields
        formData.append('name', gameData.value.name);
        formData.append('author', gameData.value.author);
        formData.append('type', gameData.value.type);
        formData.append('ageGroup', gameData.value.ageGroup);
        
        // Add files
        formData.append('thumbnail', gameData.value.thumbnail);
        
        // Add each image file separately
        gameData.value.images.forEach(image => {
          formData.append('images', image);
        });

        // Debug log for FormData contents
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
          const value = pair[1];
          if (value instanceof File) {
            console.log(`${pair[0]}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
          } else {
            console.log(`${pair[0]}: ${value}`);
          }
        }

        await store.dispatch('createGame', formData);
        await fetchGames();
        
        // Reset form
        gameData.value = {
          name: '',
          author: '',
          type: '',
          ageGroup: '',
          thumbnail: null,
          images: []
        };

        // Reset file inputs
        document.getElementById('thumbnail').value = '';
        document.getElementById('images').value = '';
        
      } catch (err) {
        console.error('Submit error:', err);
        error.value = err.message || 'Failed to create game';
      } finally {
        loading.value = false;
      }
    };

    const editGame = (game) => {
      editData.value = { ...game };
      showEditModal.value = true;
    };

    const handleEditThumbnailChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        editData.value.newThumbnail = file;
      }
    };

    const handleEditImagesChange = (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        editData.value.newImages = files;
      }
    };

    const handleEditSubmit = async () => {
      try {
        loading.value = true;
        error.value = '';

        const formData = new FormData();
        
        // Add text fields
        formData.append('name', editData.value.name);
        formData.append('author', editData.value.author);
        formData.append('type', editData.value.type);
        formData.append('ageGroup', editData.value.ageGroup);
        
        // Add new thumbnail if selected
        if (editData.value.newThumbnail) {
          formData.append('thumbnail', editData.value.newThumbnail);
        }
        
        // Add new images if selected
        if (editData.value.newImages.length > 0) {
          editData.value.newImages.forEach(image => {
            formData.append('images', image);
          });
        }

        await store.dispatch('updateGame', {
          id: editData.value._id,
          formData
        });
        
        await fetchGames();
        showEditModal.value = false;
      } catch (err) {
        error.value = err.message || 'Failed to update game';
      } finally {
        loading.value = false;
      }
    };

    const deleteGame = async (gameId) => {
      if (!confirm('Are you sure you want to delete this game?')) {
        return;
      }

      try {
        loading.value = true;
        error.value = '';
        await store.dispatch('deleteGame', gameId);
        await fetchGames();
      } catch (err) {
        error.value = err.message || 'Failed to delete game';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchGames();
    });

    return {
      games,
      loading,
      error,
      gameData,
      editData,
      showEditModal,
      API_URL,
      ASSETS_URL,
      handleThumbnailChange,
      handleImagesChange,
      handleSubmit,
      editGame,
      handleEditThumbnailChange,
      handleEditImagesChange,
      handleEditSubmit,
      deleteGame
    };
  }
};
</script>

<style scoped>
.admin-games {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.add-game-form {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form {
  display: grid;
  gap: 1rem;
  max-width: 600px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-text {
  color: #666;
  font-size: 0.875rem;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.game-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  margin: 0 0 1rem 0;
}

.game-info p {
  margin: 0.5rem 0;
}

.game-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
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

.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  width: 100%;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.loading, .error, .no-games {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
}

.current-thumbnail,
.current-images {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.thumbnail-preview {
  max-width: 200px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 