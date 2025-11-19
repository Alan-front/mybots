<script setup>
import { ref, onMounted } from "vue";

const API_URL = import.meta.env.VITE_API_URL;

const bots = ref([]);
const formData = ref({
  nombre: "",
  provider: "groq",
  token: "",
  prompt_base: "",
  tipo: "lite",
  tema: "claro",
  allowed_domains: [],
});
const editando = ref(false);
const botId = ref(null);

const obtenerBots = async () => {
  try {
    const response = await fetch(`${API_URL}/api/bots`);
    bots.value = await response.json();
  } catch (error) {
    console.error("Error al obtener bots:", error);
  }
};

const prepararDatosParaEnvio = () => {
  const datos = { ...formData.value };

  let dominios = datos.allowed_domains || [];

  if (typeof dominios === "string") {
    dominios = dominios
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
  }

  datos.allowed_domains = Array.isArray(dominios) ? dominios : [];

  console.log("Datos preparados:", datos);

  return datos;
};

const crearBot = async () => {
  try {
    const datosParaEnviar = prepararDatosParaEnvio();

    const response = await fetch(`${API_URL}/api/bots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosParaEnviar),
    });

    if (response.ok) {
      await obtenerBots();
      limpiarFormulario();
    }
  } catch (error) {
    console.error("Error al crear bot:", error);
  }
};

const editarBot = (bot) => {
  formData.value = {
    nombre: bot.nombre,
    provider: bot.provider,
    token: bot.token,
    prompt_base: bot.prompt_base,
    tipo: bot.tipo,
    tema: bot.tema,
    allowed_domains: (bot.allowed_domains || []).join(", "),
  };
  botId.value = bot.id;
  editando.value = true;
  console.log("Bot ID a editar:", bot.id);
};

const actualizarBot = async () => {
  const id = botId.value;
  console.log("ID del bot a actualizar:", id);

  if (!id) {
    alert("Error: No se encontró el ID del bot");
    return;
  }

  try {
    const datosParaEnviar = prepararDatosParaEnvio();

    const url = `${API_URL}/api/bots/${id}`;
    console.log("URL completa:", url);

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosParaEnviar),
    });

    if (response.ok) {
      await obtenerBots();
      limpiarFormulario();
      alert("Bot actualizado correctamente");
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error al actualizar el bot");
  }
};

const guardarBot = () => {
  if (editando.value) {
    actualizarBot();
  } else {
    crearBot();
  }
};

const eliminarBot = async (id) => {
  if (!confirm("¿Eliminar este bot?")) return;

  try {
    const response = await fetch(`${API_URL}/api/bots/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await obtenerBots();
    }
  } catch (error) {
    console.error("Error al eliminar bot:", error);
  }
};

const crearIframe = (id) => {
  const url = `${window.location.origin}/widget/${id}`;
  prompt(
    "Copia el siguiente código iframe para integrar el bot en tu sitio web:",
    `<iframe src="${url}" width="400" height="600" frameborder="0"></iframe>`
  );
};

const limpiarFormulario = () => {
  formData.value = {
    nombre: "",
    provider: "groq",
    token: "",
    prompt_base: "",
    tipo: "lite",
    tema: "claro",
    allowed_domains: [],
  };
  editando.value = false;
  botId.value = null;
};

onMounted(() => {
  obtenerBots();
});
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Mis Bots</h1>

    <!-- Formulario -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">
        {{ editando ? "Editar Bot" : "Crear Nuevo Bot" }}
      </h2>

      <form @submit.prevent="guardarBot" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nombre</label>
          <input
            v-model="formData.nombre"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Provider</label>
            <select
              v-model="formData.provider"
              class="w-full px-3 py-2 border rounded-lg"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="groq">Groq</option>
              <option value="google">Google Gemini</option>
              <option value="mistral">Mistral AI</option>
              <option value="cohere">Cohere</option>
            </select>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Token API</label>
            <input
              v-model="formData.token"
              type="text"
              class="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Prompt Base</label>
          <textarea
            v-model="formData.prompt_base"
            rows="4"
            required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Tipo</label>
            <select
              v-model="formData.tipo"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lite">Lite (sin avatar)</option>
              <option value="avatar">Con Avatar</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Tema</label>
            <select
              v-model="formData.tema"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Lista</label>
            <input
              v-model="formData.allowed_domains"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dominio1.com, dominio2.com"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {{ editando ? "Actualizar Bot" : "Crear Bot" }}
          </button>

          <button
            v-if="editando"
            type="button"
            @click="limpiarFormulario"
            class="px-6 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- Tabla de Bots -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Nombre
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Tipo
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Provider
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Tema
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="bot in bots" :key="bot.id">
            <td class="px-6 py-4 whitespace-nowrap">{{ bot.nombre }}</td>

            <!-- Tipo -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="
                  bot.tipo === 'avatar'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                "
              >
                {{ bot.tipo }}
              </span>
            </td>

            <!-- Provider -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs rounded-full"
                :class="{
                  'bg-blue-100 text-blue-800': bot.provider === 'openai',
                  'bg-yellow-100 text-yellow-800': bot.provider === 'anthropic',
                  'bg-red-100 text-red-800': bot.provider === 'groq',
                  'bg-green-100 text-green-800': bot.provider === 'google',
                  'bg-purple-100 text-purple-800': bot.provider === 'mistral',
                  'bg-pink-100 text-pink-800': bot.provider === 'cohere',
                  'bg-gray-100 text-gray-800': ![
                    'openai',
                    'anthropic',
                    'groq',
                    'google',
                    'mistral',
                    'cohere',
                  ].includes(bot.provider),
                }"
              >
                {{ bot.provider || "Desconocido" }}
              </span>
            </td>

            <td class="px-6 py-4 whitespace-nowrap">{{ bot.tema }}</td>

            <!-- Acciones -->
            <td class="px-6 py-4 whitespace-nowrap space-x-2">
              <button
                @click="editarBot(bot)"
                class="text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                @click="eliminarBot(bot.id)"
                class="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
              <button
                @click="crearIframe(bot.id)"
                class="text-green-600 hover:text-green-800"
              >
                Iframe
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="bots.length === 0" class="text-center py-8 text-gray-500">
        No hay bots creados
      </div>
    </div>
  </div>
</template>
