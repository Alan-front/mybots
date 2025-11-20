<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const botId = route.params.id;

const bot = ref(null);
const messages = ref([]);
const input = ref("");
const loading = ref(false);
const isOpen = ref(true);

const isDark = computed(() => bot.value?.tema === "oscuro");

// Aplicar tema
watch(
  () => bot.value?.tema,
  (nuevoTema) => {
    if (nuevoTema === "oscuro") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  },
  { immediate: true }
);

const obtenerBot = async () => {
  try {
    fetch(`https://mybots-mwf4.onrender.com/api/bots/${botId}`);

    bot.value = await response.json();

    messages.value.push({
      role: "assistant",
      content: "¡Hola! ¿En qué puedo ayudarte?",
    });
  } catch (error) {
    console.error("Error al cargar bot:", error);
  }
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};

const enviarMensaje = async () => {
  if (!input.value.trim() || loading.value) return;

  const userMessage = input.value;
  input.value = "";

  messages.value.push({
    role: "user",
    content: userMessage,
  });

  loading.value = true;

  try {
    const provider = bot.value.provider;
    const token = bot.value.token;

    let url = "";
    let body = {};

    // ---------------------------
    //   SWITCH POR PROVIDER
    // ---------------------------
    if (provider === "groq") {
      url = "https://api.groq.com/openai/v1/chat/completions";
      body = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: bot.value.prompt_base },
          ...messages.value,
        ],
        max_tokens: 1024,
      };
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      body = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: bot.value.prompt_base },
          ...messages.value,
        ],
        max_tokens: 1024,
      };
    } else if (provider === "anthropic") {
      url = "https://api.anthropic.com/v1/messages";
      body = {
        model: "claude-3-haiku-20240307",
        messages: [{ role: "user", content: userMessage }],
        system: bot.value.prompt_base,
        max_tokens: 1024,
      };
    } else if (provider === "google") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${token}`;
      body = {
        contents: [
          {
            parts: [{ text: `${bot.value.prompt_base}\n\n${userMessage}` }],
          },
        ],
      };
    } else if (provider === "mistral") {
      url = "https://api.mistral.ai/v1/chat/completions";
      body = {
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: bot.value.prompt_base },
          ...messages.value,
        ],
        max_tokens: 1024,
      };
    } else if (provider === "cohere") {
      url = "https://api.cohere.com/v1/chat";
      body = {
        model: "command-r",
        message: `${bot.value.prompt_base}\n\n${userMessage}`,
      };
    }

    // ------------------------------
    //      EJECUTAR REQUEST
    // ------------------------------
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: provider === "google" ? "" : `Bearer ${token}`,
        "x-api-key": provider === "google" ? token : undefined,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // ------------------------------
    //   NORMALIZAR RESPUESTA
    // ------------------------------
    let text = "Lo siento, no pude procesar la respuesta.";

    if (
      provider === "groq" ||
      provider === "openai" ||
      provider === "mistral"
    ) {
      text = data?.choices?.[0]?.message?.content;
    } else if (provider === "anthropic") {
      text = data?.content?.[0]?.text;
    } else if (provider === "google") {
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (provider === "cohere") {
      text = data?.text;
    }

    messages.value.push({
      role: "assistant",
      content: text || "Lo siento, ocurrió un error.",
    });
  } catch (error) {
    console.error("Error:", error);
    messages.value.push({
      role: "assistant",
      content: "Lo siento, ocurrió un error.",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  obtenerBot();
});
</script>

<template>
  <div v-if="bot" class="fixed bottom-4 right-4 z-50">
    <!-- pane de chat -->
    <div v-show="isOpen" class="panel-chat">
      <!-- header -->
      <div class="p-4 flex justify-between items-center header-chat">
        <h2 class="text-lg font-semibold header-text">{{ bot.nombre }}</h2>
        <button
          @click="toggleChat"
          class="text-2xl hover:opacity-80 header-text"
        >
          &times;
        </button>
      </div>

      <!-- mensajes -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="[
            'flex',
            msg.role === 'user' ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            :class="[
              'max-w-xs px-4 py-2 rounded-lg',
              msg.role === 'user' ? 'user-message' : 'bot-message',
            ]"
          >
            {{ msg.content }}
          </div>
        </div>

        <div v-if="loading" class="flex justify-start">
          <div class="bot-message px-4 py-2 rounded-lg">Escribiendo...</div>
        </div>
      </div>

      <!-- input -->
      <div
        :class="[
          'p-4 border-t',
          isDark ? 'border-gray-700' : 'border-gray-300',
        ]"
      >
        <form @submit.prevent="enviarMensaje" class="flex gap-2">
          <input
            v-model="input"
            type="text"
            placeholder="Escribe un mensaje..."
            class="input-chat"
          />

          <button
            type="submit"
            :disabled="loading"
            class="btn-enviar px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>

    <!-- boton flotante -->
    <button
      @click="toggleChat"
      class="btn-flotante w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
    >
      <svg
        v-if="!isOpen"
        class="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <svg
        v-else
        class="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.header-chat {
  background: var(--header-bg-color);
}

.header-text {
  color: var(--header-text-color);
}

.panel-chat {
  width: 24rem;
  height: 500px;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s;

  background-color: var(--panel-bg-color);
  color: var(--panel-text-color);
}

.user-message {
  background: var(--header-bg-color);
  color: var(--header-text-color);
}

.bot-message {
  background: var(--bg-text-color);
  color: var(--panel-text-color-alt);
}

.btn-enviar {
  background-color: var(--color-brand);
  color: white;
}

.btn-enviar:hover {
  background-color: var(--color-brand-dark);
}

.btn-flotante {
  background-color: var(--color-brand);
}

.btn-flotante:hover {
  background-color: var(--color-brand-dark);
}

.input-chat {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: var(--panel-bg-color);
  color: var(--panel-text-color);
  border: 1px solid var(--panel-text-color-alt);
  transition: box-shadow 0.15s, border-color 0.15s;
}

.input-chat:focus {
  outline: none;
  border-color: transparent;
  box-shadow: 0 0 0 2px var(--color-brand);
}

.input-chat::placeholder {
  color: rgb(156, 163, 175);
}
</style>
