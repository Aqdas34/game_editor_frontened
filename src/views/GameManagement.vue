<template>
  <div class="game-management">
    <h1>Game Management</h1>
    
    <!-- Game List -->
    <div class="game-list">
      <h2>Games</h2>
      <div class="games-grid">
        <div v-for="game in games" :key="game.sku" class="game-card">
          <img :src="game.thumbnail" :alt="game.name" class="game-thumbnail">
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>Author: {{ game.author }}</p>
            <p>Type: {{ game.type }}</p>
            <p>Age Group: {{ game.ageGroup }}</p>
            <p>SKU: {{ game.sku }}</p>
            <div class="game-actions">
              <button @click="editGame(game)" class="edit-btn">Edit</button>
              <button @click="deleteGame(game.sku)" class="delete-btn">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Game Form -->
    <div class="game-form" v-if="showForm">
      <h2>{{ isEditing ? 'Edit Game' : 'Add New Game' }}</h2>
      <form @submit.prevent="submitGame">
        <div class="form-group">
          <label>Game Name:</label>
          <input v-model="currentGame.name" required>
        </div>
        
        <div class="form-group">
          <label>Author:</label>
          <input v-model="currentGame.author" required>
        </div>
        
        <div class="form-group">
          <label>Type:</label>
          <select v-model="currentGame.type" required>
            <option value="puzzle">Puzzle</option>
            <option value="action">Action</option>
            <option value="strategy">Strategy</option>
            <option value="educational">Educational</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Age Group:</label>
          <select v-model="currentGame.ageGroup" required>
            <option value="3-6">3-6 years</option>
            <option value="7-12">7-12 years</option>
            <option value="13-17">13-17 years</option>
            <option value="18+">18+ years</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Thumbnail:</label>
          <input type="file" @change="handleThumbnailUpload" accept="image/jpeg,image/png" required>
        </div>
        
        <div class="form-group">
          <label>Game Images:</label>
          <input type="file" @change="handleGameImagesUpload" accept="image/jpeg,image/png" multiple required>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="submit-btn">{{ isEditing ? 'Update Game' : 'Add Game' }}</button>
          <button type="button" @click="cancelForm" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Add Game Button -->
    <button v-if="!showForm" @click="showAddForm" class="add-game-btn">Add New Game</button>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import axios from 'axios'

export default {
  name: 'GameManagement',
  setup() {
    const games = ref([])
    const showForm = ref(false)
    const isEditing = ref(false)
    const currentGame = reactive({
      name: '',
      author: '',
      type: '',
      ageGroup: '',
      thumbnail: null,
      images: []
    })

    // Generate unique SKU
    const generateSKU = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 5)
      return `GAME-${timestamp}-${random}`.toUpperCase()
    }

    // Load games
    const loadGames = async () => {
      try {
        const response = await axios.get('/api/games')
        games.value = response.data
      } catch (error) {
        console.error('Error loading games:', error)
      }
    }

    // Handle thumbnail upload
    const handleThumbnailUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        currentGame.thumbnail = file
      }
    }

    // Handle game images upload
    const handleGameImagesUpload = (event) => {
      const files = Array.from(event.target.files)
      currentGame.images = files
    }

    // Show add form
    const showAddForm = () => {
      isEditing.value = false
      Object.assign(currentGame, {
        name: '',
        author: '',
        type: '',
        ageGroup: '',
        thumbnail: null,
        images: []
      })
      showForm.value = true
    }

    // Edit game
    const editGame = (game) => {
      isEditing.value = true
      Object.assign(currentGame, { ...game })
      showForm.value = true
    }

    // Delete game
    const deleteGame = async (sku) => {
      if (confirm('Are you sure you want to delete this game?')) {
        try {
          await axios.delete(`/api/games/${sku}`)
          await loadGames()
        } catch (error) {
          console.error('Error deleting game:', error)
        }
      }
    }

    // Submit game
    const submitGame = async () => {
      try {
        const formData = new FormData()
        formData.append('name', currentGame.name)
        formData.append('author', currentGame.author)
        formData.append('type', currentGame.type)
        formData.append('ageGroup', currentGame.ageGroup)
        formData.append('thumbnail', currentGame.thumbnail)
        currentGame.images.forEach(image => {
          formData.append('images', image)
        })

        if (isEditing.value) {
          await axios.put(`/api/games/${currentGame.sku}`, formData)
        } else {
          formData.append('sku', generateSKU())
          await axios.post('/api/games', formData)
        }

        await loadGames()
        showForm.value = false
      } catch (error) {
        console.error('Error submitting game:', error)
      }
    }

    // Cancel form
    const cancelForm = () => {
      showForm.value = false
    }

    // Load games on component mount
    loadGames()

    return {
      games,
      showForm,
      isEditing,
      currentGame,
      showAddForm,
      editGame,
      deleteGame,
      submitGame,
      cancelForm,
      handleThumbnailUpload,
      handleGameImagesUpload
    }
  }
}
</script>

<style scoped>
.game-management {
  padding: 2rem;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.game-card {
  border: 1px solid #ddd;
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

.game-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.game-form {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-game-btn {
  background-color: #4CAF50;
  color: white;
  margin-top: 2rem;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.cancel-btn {
  background-color: #9e9e9e;
  color: white;
}
</style> 