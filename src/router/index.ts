import { createRouter, createWebHistory } from 'vue-router'
import Editor from '../components/editor/Editor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: Editor,
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('../views/PreviewView.vue'),
    },
  ],
})

export default router
