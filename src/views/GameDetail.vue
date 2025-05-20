<template>
  <div class="game-detail">
    <div v-if="loading" class="loading">
      Loading game...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <template v-else>
      <div class="game-header">
        <h1>{{ game.name }}</h1>
        <div class="game-meta">
          <span class="author">By {{ game.author }}</span>
          <span class="type">{{ game.type }}</span>
          <span class="age">{{ game.ageGroup }}</span>
        </div>
      </div>

      <div class="game-content">
        <div class="game-pages">
          <div v-for="(image, index) in game.images" :key="index" class="page-card">
            <img
              :src="`${ASSETS_URL}/${image}`"
              :alt="`Page ${index + 1}`"
              :class="{ 'blurred': !isPurchased && index >= 2 }"
            >
            <div class="page-actions">
              <button @click="openEditor(image, index)" class="btn btn-primary">
                Edit Image
              </button>
            </div>
            <div v-if="!isPurchased && index >= 2" class="purchase-overlay">
              <p>Purchase to unlock</p>
              <button @click="purchaseGame" class="btn btn-primary">Buy Now ($9)</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Pintura Editor Modal -->
    <div v-if="showEditor" class="modal">
      <div class="modal-content editor-modal">
        <button @click="showEditor = false" class="close-btn">&times;</button>
        <PinturaEditor
          v-if="currentImage"
          :src="currentImage"
          :config="editorConfig"
          @save="handleEditorSave"
          @close="showEditor = false"
        />
      </div>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="modal">
      <div class="modal-content">
        <h2>Purchase Game</h2>
        <p>Complete your purchase to unlock all game pages</p>
        <div id="payment-element"></div>
        <button
          @click="confirmPurchase"
          class="btn btn-primary"
          :disabled="processingPayment"
        >
          {{ processingPayment ? 'Processing...' : 'Complete Purchase' }}
        </button>
        <button @click="showPurchaseModal = false" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { PinturaEditor } from '@pqina/vue-pintura';
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.VUE_APP_STRIPE_PUBLIC_KEY);
const ASSETS_URL = process.env.VUE_APP_ASSETS_URL || 'https://game-editor-backened.onrender.com/uploads';

export default {
  name: 'GameDetail',
  components: {
    PinturaEditor
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const error = ref('');
    const game = ref(null);
    const showPurchaseModal = ref(false);
    const processingPayment = ref(false);
    const currentPage = ref(0);
    const showEditor = ref(false);
    const currentImage = ref(null);

    const isPurchased = computed(() => {
      return store.getters.purchasedGames.some(g => g._id === game.value?._id);
    });

    const editorConfig = {
      imageCropAspectRatio: 1,
      imageCropMinSize: { width: 100, height: 100 },
      styleRules: {
        '--color-background': '#ffffff',
        '--color-foreground': '#000000',
        '--color-primary': '#3498db',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#f0f0f0',
        '--color-secondary-text': '#000000',
      },
      cropSelectPresetFilter: 'landscape',
      cropSelectPresetOptions: [
        [1, 1],
        [4, 3],
        [16, 9],
        [3, 4],
        [9, 16],
      ],
      cropSelectPresetLabels: {
        '1:1': 'Square',
        '4:3': 'Landscape',
        '16:9': 'Widescreen',
        '3:4': 'Portrait',
        '9:16': 'Mobile',
      },
      imageEditor: {
        crop: true,
        filter: true,
        finetune: true,
        annotate: true,
        decorate: true,
        resize: true,
        rotate: true,
        cropSelectPresetFilter: 'landscape',
        cropSelectPresetOptions: [
          [1, 1],
          [4, 3],
          [16, 9],
          [3, 4],
          [9, 16],
        ],
        cropSelectPresetLabels: {
          '1:1': 'Square',
          '4:3': 'Landscape',
          '16:9': 'Widescreen',
          '3:4': 'Portrait',
          '9:16': 'Mobile',
        },
      }
    };

    const handleEditorSave = async (output) => {
      try {
        // Convert the edited image to a blob
        const response = await fetch(output.dest);
        const blob = await response.blob();
        
        // Create a FormData object to send the image
        const formData = new FormData();
        formData.append('image', blob, 'edited-image.png');
        formData.append('gameId', game.value._id);
        formData.append('pageIndex', currentPage.value);

        // Send the edited image to your backend
        const saveResponse = await fetch(`${process.env.VUE_APP_API_URL}/games/save-edited-image`, {
          method: 'POST',
          body: formData
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save edited image');
        }

        // Refresh the game data to show the updated image
        const updatedGame = await saveResponse.json();
        game.value = updatedGame;
        showEditor.value = false;
      } catch (err) {
        console.error('Error saving edited image:', err);
        error.value = 'Failed to save edited image';
      }
    };

    const openEditor = (image, index) => {
      try {
        const imageUrl = `${ASSETS_URL}/${image}`;
        // Verify the image exists before opening the editor
        fetch(imageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error('Image not found');
            }
            currentImage.value = imageUrl;
            currentPage.value = index;
            showEditor.value = true;
          })
          .catch(err => {
            console.error('Error loading image:', err);
            error.value = 'Failed to load image for editing';
          });
      } catch (err) {
        console.error('Error opening editor:', err);
        error.value = 'Failed to open image editor';
      }
    };

    const purchaseGame = async () => {
      try {
        const { clientSecret } = await store.dispatch('createOrder', game.value._id);
        showPurchaseModal.value = true;

        const elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
      } catch (error) {
        console.error('Error initiating purchase:', error);
      }
    };

    const confirmPurchase = async () => {
      try {
        processingPayment.value = true;
        const { error } = await stripe.confirmPayment({
          elements: stripe.elements(),
          confirmParams: {
            return_url: `${window.location.origin}/games/${game.value._id}`
          }
        });

        if (error) {
          throw error;
        }

        await store.dispatch('confirmOrder', game.value._id);
        showPurchaseModal.value = false;
        router.go(0); // Refresh the page to show purchased content
      } catch (error) {
        console.error('Error processing payment:', error);
      } finally {
        processingPayment.value = false;
      }
    };

    onMounted(async () => {
      try {
        const gameId = route.params.id;
        const response = await fetch(`${process.env.VUE_APP_API_URL}/games/${gameId}`);
        if (!response.ok) throw new Error('Game not found');
        game.value = await response.json();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      error,
      game,
      showPurchaseModal,
      processingPayment,
      isPurchased,
      showEditor,
      currentImage,
      editorConfig,
      handleEditorSave,
      openEditor,
      purchaseGame,
      confirmPurchase,
      ASSETS_URL
    };
  }
};
</script>

<style scoped>
.game-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.game-header {
  margin-bottom: 2rem;
}

.game-header h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.game-meta {
  display: flex;
  gap: 1rem;
  color: #666;
}

.game-pages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.page-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.page-card img.blurred {
  filter: blur(10px);
}

.page-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.page-card:hover .page-actions {
  opacity: 1;
}

.purchase-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 1rem;
  text-align: center;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.editor-modal {
  padding: 0;
  width: 95%;
  height: 95vh;
  max-width: none;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  z-index: 1001;
}

.modal-content h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: #666;
}

#payment-element {
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  margin-left: 1rem;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #e74c3c;
}
</style> 