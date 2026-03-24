<script setup lang="ts">
defineProps<{
  shop: string
  token: string
}>()
</script>

<template>
  <div>
    <h1>Vue Admin</h1>
    <p>Shop: {{ shop }}</p>
    <p>Token: {{ token }}</p>
  </div>
</template>