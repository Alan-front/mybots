import { createRouter, createWebHistory } from "vue-router";
import UserPanel from "./components/UserPanel.vue";
import Widget from "./components/Widget.vue";

const routes = [
  { path: "/", component: UserPanel },
  { path: "/widget/:id", component: Widget },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
