<script setup lang="ts">
import { AppProvider } from '@ownego/polaris-vue'
import enTranslations from '@ownego/polaris-vue/dist/locales/en.json'
</script>

<template>
  <AppProvider :i18n="enTranslations">
    <router-view />
  </AppProvider>
</template>
