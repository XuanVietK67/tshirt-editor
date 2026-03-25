<script setup lang="ts">
const model = defineModel<boolean>()
</script>

<template>
  <label class="toggle">
    <input type="checkbox" v-model="model">
    <div class="toggle-track"></div>
    <div class="toggle-thumb"></div>
  </label>
</template>
