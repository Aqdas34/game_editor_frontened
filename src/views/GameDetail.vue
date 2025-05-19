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
        <div class="editor-container">
          <div class="editor-toolbar">
            <button @click="addText" class="tool-btn">Add Text</button>
            <button @click="togglePen" class="tool-btn" :class="{ active: isPenActive }">
              Pen
            </button>
            <button @click="addShape('rect')" class="tool-btn">Rectangle</button>
            <button @click="addShape('circle')" class="tool-btn">Circle</button>
            <button @click="addEmoji" class="tool-btn">Add Emoji</button>
            <button @click="saveCanvas" class="tool-btn save">Save</button>
          </div>
          <div class="canvas-container">
            <canvas ref="canvas" class="editor-canvas"></canvas>
          </div>
        </div>

        <div class="game-pages">
          <div v-for="(image, index) in game.images" :key="index" class="page-card">
            <img
              :src="image"
              :alt="`Page ${index + 1}`"
              :class="{ 'blurred': !isPurchased && index >= 2 }"
            >
            <div v-if="!isPurchased && index >= 2" class="purchase-overlay">
              <p>Purchase to unlock</p>
              <button @click="purchaseGame" class="btn btn-primary">Buy Now ($9)</button>
            </div>
          </div>
        </div>
      </div>
    </template>

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
import { fabric } from 'fabric';
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.VUE_APP_STRIPE_PUBLIC_KEY);

export default {
  name: 'GameDetail',
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const canvas = ref(null);
    const loading = ref(true);
    const error = ref('');
    const game = ref(null);
    const isPenActive = ref(false);
    const showPurchaseModal = ref(false);
    const processingPayment = ref(false);
    const currentPage = ref(0);

    const isPurchased = computed(() => {
      return store.getters.purchasedGames.some(g => g._id === game.value?._id);
    });

    const initCanvas = () => {
      const fabricCanvas = new fabric.Canvas(canvas.value, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      });

      // Load the current page image
      if (game.value?.images[currentPage.value]) {
        fabric.Image.fromURL(game.value.images[currentPage.value], img => {
          fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
        });
      }

      return fabricCanvas;
    };

    const addText = () => {
      const text = new fabric.IText('Double click to edit', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#000000'
      });
      canvas.value.add(text);
    };

    const togglePen = () => {
      isPenActive.value = !isPenActive.value;
      if (isPenActive.value) {
        canvas.value.isDrawingMode = true;
        canvas.value.freeDrawingBrush.width = 2;
        canvas.value.freeDrawingBrush.color = '#000000';
      } else {
        canvas.value.isDrawingMode = false;
      }
    };

    const addShape = (type) => {
      let shape;
      if (type === 'rect') {
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2
        });
      } else if (type === 'circle') {
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2
        });
      }
      canvas.value.add(shape);
    };

    const addEmoji = () => {
      // Implement emoji picker and add selected emoji to canvas
      // This is a placeholder for the emoji functionality
    };

    const saveCanvas = () => {
      const dataURL = canvas.value.toDataURL({
        format: 'png',
        quality: 1
      });
      // Implement save functionality
      console.log('Saving canvas:', dataURL);
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
        canvas.value = initCanvas();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {
      canvas,
      loading,
      error,
      game,
      isPenActive,
      showPurchaseModal,
      processingPayment,
      isPurchased,
      addText,
      togglePen,
      addShape,
      addEmoji,
      saveCanvas,
      purchaseGame,
      confirmPurchase
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

.editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.editor-toolbar {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-btn:hover {
  background: #f0f0f0;
}

.tool-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.tool-btn.save {
  background: #2ecc71;
  color: white;
  border-color: #2ecc71;
}

.canvas-container {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

.editor-canvas {
  border: 1px solid #ddd;
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
  margin-left: 1rem;
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