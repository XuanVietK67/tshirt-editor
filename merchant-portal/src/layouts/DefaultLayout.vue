<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/products">Products</router-link>
    </nav>

    <router-view />
  </div>
</template>