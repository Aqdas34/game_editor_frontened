<template>
  <div class="editor-container">
    <div class="editor-header">
      <h1>{{ name }}</h1>
      <div class="meta-info">
        <span>Age: {{ age }}</span>
        <span>SKU: {{ sku }}</span>
      </div>
    </div>

    <div class="editor-workspace">
      <div class="tools-panel">
        <button 
          v-for="tool in tools" 
          :key="tool.name"
          @click="selectTool(tool)"
          :class="['tool-btn', { active: currentTool === tool.name }]"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-name">{{ tool.name }}</span>
        </button>
      </div>

      <div class="canvas-area">
        <div class="thumbnails-panel">
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="thumbnail"
            :class="{ active: selectedImageIndex === index }"
            @click="selectImage(index)"
          >
            <img :src="`https://game-editor-backened.onrender.com/uploads/users/${userId}/${route.params.id}/${image}`" :alt="'Thumbnail ' + (index + 1)">
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
import { ref, watch } from 'vue';
import { PinturaEditor } from '@pqina/vue-pintura';
import axios from 'axios';
import { useRoute } from 'vue-router';
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
    const store = useStore();
    const userId = store.getters.currentUser?.id;
    // Ensure axios sends the token for all requests
    if (store.state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${store.state.token}`;
    }
    const name = ref('');
    const age = ref('');
    const sku = ref('');
    const currentTool = ref('text');
    const selectedImageIndex = ref(0);
    const showEditor = ref(true);
    const currentImage = ref(null);
    const images = ref([]);
    const API_URL = process.env.VUE_APP_API_URL;
    const inlineResult = ref(null);

    const tools = [
      { name: 'text', icon: 'A' }
    ];

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
      },
      imageEditor: {
        annotate: {
          tools: ['text'],
          text: {
            fontFamily: ['Arial', 'Helvetica', 'Times New Roman'],
            fontSize: [12, 16, 24, 36],
            textAlign: ['left', 'center', 'right'],
          }
        }
      }
    };

    const selectTool = (tool) => {
      currentTool.value = tool.name;
      if (tool.name === 'text') {
        editorProps.imageEditor.annotate.tools = ['text'];
      }
    };

    const selectImage = (index) => {
      selectedImageIndex.value = index;
      currentImage.value = `http://localhost:5000/uploads/users/${userId}/${route.params.id}/${images.value[index]}`;
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

    // Duplicate images for user and load them
    const fetchUserGameImages = async () => {
      try {
        console.log('Calling duplicate-for-user:', userId, route.params.id);
        await axios.post(`${API_URL}/games/${route.params.id}/duplicate-for-user`, { userId });
        const response = await axios.get(`${API_URL}/games/${route.params.id}/user-images/${userId}`);
        const game = response.data;
        name.value = game.name;
        age.value = game.ageGroup;
        sku.value = game.sku;
        images.value = game.images;
        if (images.value.length > 0) {
          currentImage.value = `https://game-editor-backened.onrender.com/uploads/users/${userId}/${route.params.id}/${images.value[0]}`;
        }
      } catch (error) {
        console.error('Error fetching user game images:', error);
      }
    };

    console.log('store.getters.currentUser:', store.getters.currentUser);
    console.log('userId:', userId);

    watch(() => store.getters.currentUser, (newUser) => {
      if (newUser && newUser.id) fetchUserGameImages();
    }, { immediate: true });

    return {
      name,
      age,
      sku,
      tools,
      images,
      currentTool,
      selectedImageIndex,
      showEditor,
      currentImage,
      editorProps,
      inlineResult,
      selectTool,
      selectImage,
      handleProcess,
      handleLoad,
      userId,
      route
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

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.meta-info {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.meta-info span {
  margin-right: 1rem;
}

.editor-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.tools-panel {
  width: 80px;
  background-color: #2c3e50;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tool-btn {
  width: 60px;
  height: 60px;
  border: none;
  background: none;
  color: #fff;
  cursor: pointer;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.tool-btn.active {
  background-color: #34495e;
}

.tool-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.tool-name {
  font-size: 0.8rem;
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
}

.thumbnail.active {
  border-color: #3498db;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
</style>