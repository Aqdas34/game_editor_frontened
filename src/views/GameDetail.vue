<template>
  <div class="editor-container">
    <div class="editor-header">
      <div class="header-top">
        <h1>{{ name }}</h1>
        <div class="ownership-status" v-if="!isLoading">
          <span v-if="!shouldLockImages" class="owned-badge">You Own This Game</span>
          <button v-else @click="showPaymentPrompt" class="purchase-btn">Unlock Full Game</button>
        </div>
        <div v-else class="loading-status">
          <span>Checking ownership...</span>
        </div>
      </div>
      <div class="meta-info">
        <span>Age: {{ age }}</span>
        <span>SKU: {{ sku }}</span>
        <span v-if="!shouldLockImages" class="all-images-unlocked">
          <span class="ownership-icon">✓</span> All Images Unlocked
        </span>
        <span v-else-if="!isLoading" class="free-preview">
          <span class="preview-icon">ℹ</span> Free Preview (First 2 images)
        </span>
      </div>
    </div>

    <div class="editor-workspace">


      <div class="canvas-area">
        <div class="thumbnails-panel">
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="thumbnail"
            :class="{ 
              active: selectedImageIndex === index,
              'locked-thumbnail': shouldLockImages && index >= 2 && !isLoading,
              'loading': isLoading
            }"
            @click="!isLoading && handleThumbnailClick(index)"
          >
            <img :src="`${ASSETS_URL}/users/${userId}/${route.params.id}/${image}`" :alt="'Thumbnail ' + (index + 1)">
            <span class="thumbnail-number">{{ index + 1 }}</span>


            <div v-if="shouldLockImages && index >= 2 && !isLoading" class="locked-overlay">
              <button class="unlock-btn">Pay to Unlock</button>
            </div>
            
            <!-- Show unlocked indicator for premium content that's unlocked -->
            <div v-else-if="index >= 2 && !shouldLockImages" class="unlocked-indicator">
              <span class="unlock-icon">✓</span>
            </div>
            
            <!-- Show loading overlay when loading -->
            <div v-if="isLoading" class="loading-overlay">
              <span class="loading-spinner"></span>
            </div>
          </div>
        </div>

        <div class="main-canvas">
          <pintura-editor
            v-if="showEditor"
            v-bind="editorProps"
            :src="currentImage"
            @pintura:process="handleProcess"
            @pintura:load="handleLoad"
            style="height: 100%"
          />
        </div>
      </div>
    </div>

    <div class="editor-footer">
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue';
import { PinturaEditor } from '@pqina/vue-pintura';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  // editor
  createDefaultImageReader,
  createDefaultImageWriter,
  createDefaultShapePreprocessor,
  locale_en_gb,
  getEditorDefaults,
  
  // plugins
  setPlugins,
  plugin_crop,
  plugin_crop_locale_en_gb,
  plugin_filter,
  plugin_filter_defaults,
  plugin_filter_locale_en_gb,
  plugin_finetune,
  plugin_finetune_defaults,
  plugin_finetune_locale_en_gb,
  plugin_annotate,
  plugin_annotate_locale_en_gb,
  markup_editor_defaults,
  markup_editor_locale_en_gb,
} from '@pqina/pintura';

// Import Pintura styles
import '@pqina/pintura/pintura.css';

// Set up plugins
setPlugins(plugin_crop, plugin_finetune, plugin_filter, plugin_annotate);

export default {
  name: 'ImageEditor',
  components: {
    PinturaEditor
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const userId = store.getters.currentUser?.id;
    // Ensure axios sends the token for all requests
    if (store.state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${store.state.token}`;
    }
    const name = ref('');
    const age = ref('');
    const sku = ref('');
 
    const selectedImageIndex = ref(0);
    const showEditor = ref(true);
    const currentImage = ref(null);
    const images = ref([]);
    const API_URL = process.env.VUE_APP_API_URL;
    const inlineResult = ref(null);
    const ASSETS_URL = process.env.VUE_APP_ASSETS_URL;
    const shouldLockImages = ref(true); // Default to locked
    const isLoading = ref(true);


    const editorProps = {
      ...getEditorDefaults(),
      imageReader: createDefaultImageReader(),
      imageWriter: createDefaultImageWriter(),
      shapePreprocessor: createDefaultShapePreprocessor(),
      ...plugin_finetune_defaults,
      ...plugin_filter_defaults,
      ...markup_editor_defaults,
      locale: {
        ...locale_en_gb,
        ...plugin_crop_locale_en_gb,
        ...plugin_finetune_locale_en_gb,
        ...plugin_filter_locale_en_gb,
        ...plugin_annotate_locale_en_gb,
        ...markup_editor_locale_en_gb,
      }
   
    };



    const handleThumbnailClick = (index) => {
      // If all images are unlocked (user owns the game) or it's one of the free images (first 2)
      if (!shouldLockImages.value || index < 2) {
        // Allow selection of the image
        selectImage(index);
      } else {
        // Show payment prompt for locked images
        showPaymentPrompt();
      }
    };

    const selectImage = (index) => {
      selectedImageIndex.value = index;
      currentImage.value = `${ASSETS_URL}/users/${userId}/${route.params.id}/${images.value[index]}`;
    };

    const showPaymentPrompt = async () => {
      try {
        // Store the current game ID in localStorage to use on success/cancel pages
        localStorage.setItem('lastViewedGameId', route.params.id);
        
        // Get auth token
        const token = localStorage.getItem('token') || store.getters.token;
        if (!token) {
          alert('Please log in to purchase this game');
          router.push('/login');
          return;
        }
        
        // Call the backend to create a Stripe checkout session
        const response = await axios.post(`${API_URL}/payments/create-checkout-session`, 
          { gameId: route.params.id },
          { 
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          }
        );
        
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } catch (error) {
        console.error('Error creating checkout session:', error);
        
        // Extract detailed error information
        let errorMessage = 'Failed to create payment session';
        if (error.response?.data) {
          const errorData = error.response.data;
          if (errorData.details) {
            errorMessage = `${errorData.error}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          if (errorData.stripeError) {
            console.error('Stripe Error:', errorData.stripeError);
          }
        }
        
        alert(errorMessage);
      }
    };

    const handleProcess = async (event) => {
      try {
        inlineResult.value = URL.createObjectURL(event.detail.dest);
        const formData = new FormData();
        formData.append('image', event.detail.dest);
        formData.append('userId', userId);
        formData.append('gameId', route.params.id);
        formData.append('pageIndex', selectedImageIndex.value);
        await axios.post(`${API_URL}/games/save-edited-image-for-user`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        await fetchUserGameImages();
      } catch (error) {
        console.error('Error saving edited image:', error);
      }
    };

    const handleLoad = () => {
      console.log('Editor loaded');
    };

    // Add a method to check game ownership directly
    const checkGameOwnership = async () => {
      try {
        isLoading.value = true;
        
        // Check if user is logged in
        if (!store.getters.isAuthenticated) {
          console.log('Not logged in - game not owned');
          shouldLockImages.value = true;
          return;
        }

        // Get the current game ID
        const currentGameId = route.params.id;
        console.log('Current game ID:', currentGameId);
        
        // Use the store action to check game ownership
        const result = await store.dispatch('checkGameOwnership', currentGameId);
        const isOwned = result.owned;
        
        console.log(`Game ownership status: ${isOwned ? 'Owned' : 'Not owned'}`);
        
        // Update the lock status based on ownership
        shouldLockImages.value = !isOwned;
        console.log('shouldLockImages set to:', shouldLockImages.value);
        
      } catch (error) {
        console.error('Error checking ownership:', error);
        shouldLockImages.value = true; // Default to locked on error
      } finally {
        isLoading.value = false;
      }
    };

    // Duplicate images for user and load them
    const fetchUserGameImages = async () => {
      try {
        isLoading.value = true;
        
        // First check ownership directly
        await checkGameOwnership();
        
        console.log('After ownership check, shouldLockImages =', shouldLockImages.value);

        // Then load the game images
        console.log('Calling duplicate-for-user:', userId, route.params.id);
        await axios.post(`${API_URL}/games/${route.params.id}/duplicate-for-user`, { userId });
        const response = await axios.get(`${API_URL}/games/${route.params.id}/user-images/${userId}`);
        const game = response.data;
        name.value = game.name;
        age.value = game.ageGroup;
        sku.value = game.sku;
        images.value = game.images;
        if (images.value.length > 0) {
          currentImage.value = `${ASSETS_URL}/users/${userId}/${route.params.id}/${images.value[0]}`;
        }
        
        // Final check of the state
        console.log('FINAL STATE - Should images be locked?', shouldLockImages.value);
      } catch (error) {
        console.error('Error fetching user game images:', error);
      } finally {
        isLoading.value = false;
      }
    };

    console.log('store.getters.currentUser:', store.getters.currentUser);
    console.log('userId:', userId);

    // Add a watch for shouldLockImages to force UI refresh
    watch(shouldLockImages, (newValue) => {
      console.log('Ownership status changed:', newValue ? 'Not Owned' : 'Owned');
      // Force refresh of component elements that depend on this value
      nextTick(() => {
        // This is just to trigger reactive updates
        console.log('Forcing UI refresh after ownership change');
      });
    });

    watch(() => store.getters.currentUser, (newUser) => {
      if (newUser && newUser.id) fetchUserGameImages();
    }, { immediate: true });

    return {
      name,
      age,
      sku,
 
      images,

      selectedImageIndex,
      showEditor,
      currentImage,
      editorProps,
      inlineResult,

      handleThumbnailClick,
      selectImage,
      showPaymentPrompt,
      handleProcess,
      handleLoad,
      userId,
      route,
      ASSETS_URL,
      shouldLockImages,
      isLoading
    };
  }
};
</script>

<style>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.editor-header {
  padding: 1rem;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.ownership-status {
  display: flex;
  align-items: center;
}

.owned-badge {
  background-color: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
}

.purchase-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.purchase-btn:hover {
  background-color: #2980b9;
}

.meta-info {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.meta-info span {
  margin-right: 1rem;
}

.all-images-unlocked {
  color: #28a745;
  font-weight: bold;
}

.free-preview {
  color: #ffc107;
  font-weight: bold;
}

.editor-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}


.canvas-area {
  flex: 1;
  display: flex;
  padding: 1rem;
}

.thumbnails-panel {
  width: 200px;
  padding-right: 1rem;
  overflow-y: auto;
}

.thumbnail {
  width: 100%;
  height: 100px;
  margin-bottom: 1rem;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  position: relative;
}

.thumbnail.active {
  border-color: #3498db;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.locked-thumbnail img {
  filter: blur(5px);
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
}

.unlock-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.unlock-btn:hover {
  background-color: #c0392b;
}

.main-canvas {
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
}

.editor-footer {
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background-color: #e0e0e0;
  color: #333;
  transition: background-color 0.3s;
}

.action-btn.primary {
  background-color: #3498db;
  color: #fff;
}

.action-btn:hover {
  opacity: 0.9;
}

/* Pintura editor custom styles */
:root {
  --pintura-color-primary: #3498db;
  --pintura-color-secondary: #2c3e50;
}

.pintura-editor {
  width: 100%;
  height: 100%;
}

.thumbnail-number {
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.premium-content:before {
  content: "Premium";
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #28a745; /* Green for owned premium content */
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.premium-locked:before {
  content: "Premium";
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #dc3545; /* Red for locked premium content */
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 10; /* Make sure it appears above the overlay */
}

.unlocked-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: #28a745;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.unlock-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.ownership-icon, .preview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 4px;
  font-size: 10px;
  font-weight: bold;
}

.ownership-icon {
  background-color: #28a745;
  color: white;
}

.preview-icon {
  background-color: #ffc107;
  color: black;
}

.loading-status {
  display: flex;
  align-items: center;
}

.loading-status span {
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  position: relative;
  padding-left: 2rem;
}

.loading-status span:before {
  content: "";
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  border: 2px solid #6c757d;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>