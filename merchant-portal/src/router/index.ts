// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@pages/Home.vue'),
        meta: { title: 'Home' }
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@pages/Product.vue'),
        meta: { title: 'Products' }
      }
    ]
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// ✅ Set dynamic title (production must-have)
router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'App'
})

export default router